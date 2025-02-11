const vertices = [
    -1.0, -1.0, 0.0, 0.0, // Bottom-left
     1.0, -1.0, 1.0, 0.0, // Bottom-right
     1.0,  1.0, 1.0, 1.0, // Top-right
    -1.0,  1.0, 0.0, 1.0  // Top-left
];

const indices = [
    0, 1, 2,
    2, 3, 0
];

let mouseX = 0;
let mouseY = 0;

function main() {
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl2');

    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    const vertexShaderSource = `
        attribute vec4 position;
        attribute vec2 texCoord;
        varying vec2 vTexCoord;
        void main() {
            gl_Position = position;
            vTexCoord = texCoord;
        }
    `;
    const fragmentShaderSource = `
        precision mediump float;
        varying vec2 vTexCoord;
        uniform sampler2D uTexture;
        uniform vec4 uColor;
        uniform float uTime;
        uniform vec2 uMousePosition;

        float rand(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 texColor = texture2D(uTexture, vTexCoord);
            gl_FragColor = texColor * uColor;
            float dt = 0.0005;
            gl_FragColor.rgb += (rand(vTexCoord) - 0.5) * 0.3 * (1.0 - vTexCoord.x * (vTexCoord.y));

            float mod1 = 0.5 + 0.5*sin(uTime * dt) * 2.8;
            float mod2 = 0.5 + 0.5*cos(uTime * dt) * 2.85;
            float mod3 = 0.5 + 0.5*sin(uTime * dt) * 2.79;
            float mod4 = 0.5 + 0.5*cos(uTime * dt) * 3.95;

            float x = vTexCoord.x;
            float y = vTexCoord.y;

            gl_FragColor.g *= (1.0 - pow(x, 4.5 + mod1) * pow(y, 3.6 + mod2));
            gl_FragColor.b *= (1.0 - pow(x, 2.8 + mod3) * pow(y, 2.8 + mod4));

        }
    `;

    const vertexShader = prepareShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = prepareShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const texCoordAttributeLocation = gl.getAttribLocation(program, 'texCoord');
    const positionBuffer = gl.createBuffer();
    const texCoordBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 4 * 4, 0);

    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

    const textureLocation = gl.getUniformLocation(program, 'uTexture');
    const colorUniformLocation = gl.getUniformLocation(program, 'uColor');
    const timeUniformLocation = gl.getUniformLocation(program, 'uTime');
    const mousePositionUniformLocation = gl.getUniformLocation(program, 'uMousePosition');

    const texture = createDynamicTexture(gl);

    function render(time) {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindVertexArray(vao);

        // Update texture color over time
        const r = 1.0;
        const g = 1.0;
        const b = 1.0;
        const pixel = new Uint8Array([r * 255, g * 255, b * 255, 255]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureLocation, 0);

        gl.uniform1f(timeUniformLocation, time);
        gl.uniform4f(colorUniformLocation, 1.0, 1.0, 1.0, 1.0); // Change this to modify the color

        // get mouse position
        gl.uniform2f(mousePositionUniformLocation, mouseX, mouseY);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        
        resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, canvas.width, canvas.height);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

function createDynamicTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 0, 0, 255]); // Initial color (red)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

function prepareShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function resizeCanvasToDisplaySize(canvas) {
    // const displayWidth = window.innerWidth;
    // const displayHeight = window.innerHeight;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

main();