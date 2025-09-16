#include <stdio.h>
#include <stdint.h>
#include <math.h>
#include <assert.h>

#include "sha256.h"
#include "utils.h"

#define MOD 2305843009213693951ULL  // 2^61 - 1, large prime
#define MAX_EXPR 10000

typedef enum {
    VAR,
    PAR,
    ADD,
    MUL,
    SUB,
    DIV,
} NodeType;

typedef enum {
    STRUCTURAL,
    ALGEBRAIC,
} EquivalenceType;

typedef struct Expr {
    NodeType type;
    union {
        uint8_t ID;                // variables and constants
        struct {                    // binary operations
            struct Expr *left;
            struct Expr *right;
        };
        struct Expr *operand;   // unary operations
    };
    uint64_t s_hash; // structural hash
    uint64_t a_hash; // algebraic hash
    int s_hash_computed;
    int a_hash_computed;
} Expr;

Expr* var(uint8_t ID) {
    Expr *node = malloc(sizeof(Expr));
    node->type = VAR;
    node->ID = ID;
    return node;
}

Expr* par(uint8_t ID) {
    Expr *node = malloc(sizeof(Expr));
    node->type = PAR;
    node->ID = ID;
    return node;
}

Expr* mul(Expr *left, Expr *right) {
    Expr *node = malloc(sizeof(Expr));
    node->type = MUL;
    node->left = left;
    node->right = right;
    return node;
}

Expr* add(Expr *left, Expr *right) {
    Expr *node = malloc(sizeof(Expr));
    node->type = ADD;
    node->left = left;
    node->right = right;
    return node;
}

uint64_t hash_leaf(uint8_t id) {
    // Simple mapping from variable ID to a unique prime or seed
    return 31 + id * 2654435761 % MOD;  // Just a fast mixing hash
}

uint64_t hash(Expr *node, EquivalenceType eType) {
    if (node->s_hash_computed && eType == STRUCTURAL) return node->s_hash;
    if (node->a_hash_computed && eType == ALGEBRAIC) return node->a_hash;

    uint64_t h = 0;
    uint64_t left, right;

    switch (node->type) {
        case VAR:
        case PAR:
            if (eType == STRUCTURAL) {
                h = hash_leaf(node->type);
            } else {
                h = hash_leaf(node->ID);
            }
            break;

        case ADD:
            left = hash(node->left, eType);
            right = hash(node->right, eType);
            // Make order-independent
            h = (left + right) % MOD;
            break;

        case MUL:
            left = hash(node->left, eType);
            right = hash(node->right, eType);
            // Make order-independent
            h = (left * right) % MOD;
            break;

        case SUB:
            left = hash(node->left, eType);
            right = hash(node->right, eType);
            h = (left + MOD - right) % MOD;
            break;

        case DIV:
            left = hash(node->left, eType);
            right = hash(node->right, eType);
            h = (left * modinv(right, MOD)) % MOD;
            break;
    }

    if (eType == STRUCTURAL) {
        node->s_hash = h;
        node->s_hash_computed = 1;
        node->a_hash_computed = 0;
    } else {
        node->a_hash = h;
        node->a_hash_computed = 0;
        node->a_hash_computed = 1;
    }
    return h;
}

void free_expr(Expr *node) {
    if (!node) return;
    if (node->type == ADD || node->type == MUL || node->type == SUB || node->type == DIV) {
        free_expr(node->left);
        free_expr(node->right);
    }
    free(node);
}


// Simple infix notation printer
void print_expr_infix(Expr *node) {
    if (!node) return;

    switch (node->type) {
        case VAR:
            printf("%c", node->ID);
            break;
        case PAR:
            printf("%c", node->ID);
            break;
        case ADD:
            printf("(");
            print_expr_infix(node->left);
            printf(" + ");
            print_expr_infix(node->right);
            printf(")");
            break;
        case MUL:
            printf("(");
            print_expr_infix(node->left);
            printf(" * ");
            print_expr_infix(node->right);
            printf(")");
            break;
        case SUB:
            printf("(");
            print_expr_infix(node->left);
            printf(" - ");
            print_expr_infix(node->right);
            printf(")");
            break;
        case DIV:
            printf("(");
            print_expr_infix(node->left);
            printf(" / ");
            print_expr_infix(node->right);
            printf(")");
            break;
    }
}

typedef struct System {
    Expr* expressions[MAX_EXPR];
} System;

// void group()

Expr* normalize(Expr* node) {
    // a*x + a*y -> a * (x + y) - factorize
    // sort children in commutative ops
    // convert to canonical form

}

Expr* factorize(Expr* node) {

}

Expr* distribute(Expr* node) {

}

int main() {

    Expr* a = par(10);  // ID 1
    Expr* x = var(20);  // ID 2
    Expr* y = var(30);  // ID 3

    // === STRUCTURAL && ALGEBRAIC === //
    // Build "a * (x + y)"
    Expr* xy = add(x, y);
    Expr* expr1 = mul(a, xy);

    // Build "ax + ay"
    Expr* ax = mul(a, x);
    Expr* ay = mul(a, y);
    Expr* expr2 = add(ax, ay);

    uint64_t ah1 = hash(expr1, ALGEBRAIC);
    uint64_t ah2 = hash(expr2, ALGEBRAIC);
    assert(ah1 == ah2);
    printf("%li | %li \n", ah1, ah2);

    uint64_t sh1 = hash(expr1, STRUCTURAL);
    uint64_t sh2 = hash(expr2, STRUCTURAL);
    assert(sh1 == sh2);
    printf("%li | %li \n", sh1, sh2);


    // === STRUCTURAL === //
    Expr* b = par(1);
    Expr* c = var(2);
    Expr* d = var(3);
    Expr* e = par(4);
    Expr* f = var(5);
    Expr* g = var(6);

    Expr* bcd = mul(b, add(c, d));
    // Expr* efg = mul(e, add(f, g));
    Expr* efg = add(mul(e, f), mul(e, g));

    uint64_t bcdh = hash(bcd, STRUCTURAL);
    uint64_t efgh = hash(efg, STRUCTURAL);
    assert(bcdh == efgh);


    return 0;
}
