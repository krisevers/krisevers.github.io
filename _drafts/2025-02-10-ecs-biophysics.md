---
layout: post
title: Data-Oriented Design for Biophysics
description: Biophysical Modelling can gain a lot from apply Data-Oriented Design Principles.
summary: Biophysical Modelling can gain a lot from apply Data-Oriented Design Principles.
comments: true
tags: [ideas]
---

The central thesis of this blog post is that to build software for *in silico* simulations of biological systems the software itself should be as compositional as the biology. I propose a software library for building models of compositional systems, such as the ones found in the natural world.

## The Problem

Many models in biology implement a set of ordinary or partial differential equations (ODE/PDE) which model some component of the a biological system (e.g. ion channel, muscle fibers). These models are good at testing hypotheses of a particular spatial and temporal scale but cannot easily be integrated at different levels of analysis. However, in biology different scales inherently affect each other. For example, ion channel dynamics affect spiking dynamics which affect downstream regulatory systems. These regulatory systems than might affect the ion channel dynamics. Studying how these systems integrate is nearly impossible with current software tools, as these tools promote adopting object-oriented design principles (OOD), which has several negative consequences for the researcher or engineer. In the OOD world the system you are modelling looks like a tree of hierarchical abstractions where each object is dependent on the object that it inherits from. This is all fine for small models but is a nightmare to use for building complex multi-scale models of the human body for example.

As an example I will implement a neuron model which is represented by a set of Hodgkin-Huxley equations:

```cpp
class Neuron {
	// variables and parameters
	double C_m;
	double V_m;
	double I_ext;
	...
	
	// functions
	void update();
	double dndt();
	double dmdt();
	double dhdt();
	...
}
```

Now we can make any number of instances of this class and call the update function every simulation step. This is all fine if this is the only functionality and system that we want to implement and works well for many research questions. Instanciating other neurons with different sets of parameters is also an option using this design principle.

But what if a new cell-type is introduced which follows completely different mechanisms? You would have to write a completely new class, with new parameters, a new update function. It still sounds doable, and you will probably get a paper published and you are done. But then you get a new idea and want to connect a muscle system, and have spatially realistic topology, and add data on differential gene-expressions in particular spatial positions. This can quickly become a nightmare to manage and you will want to start from scratch over and over. OOD works well for small scale models but might not be ideal if you want to develop complex multi-scale models. I am particulary thinking of the trends in personalized medicine and digital twins.

## The Solution

For a solution I believe we should take inspiration from biology itself and try to mimick the design principles in our software.

### Compositionality

In biology every component is composed of smaller components which are in turn composed of smaller components. The brain is composed of neurons (and other cells), neurons are composed of protein structures, which are in turn composed of molecules. All these levels have their own mechanisms and dynamics. It would be a great advantage if we could in a compositional manner pick and choose how and which mechanisms we would like to add to our model of biology. This way it becomes much more managable to add or remove components. But what would be the software equivalent of such compositionality? Enter data-oriented design…

### Data Oriented Design

At the core software is just the moving and manipulation of data. This insight is what data-oriented design (DOD) is based on. In DOD the data is strictly separated from the methods and each entity (replaces objects in OOD) is merely a collection of it’s components. Components hold all the data of the entity. A system holds the functionality use the data stored in components but does not interact with the entities, it merely what data there is and updates the data according to mechanisms that are implemented in its methods. So before the main update loop all entities are initialized with their components, while during the main update loop only the systems are called on the data and the data is processed accordingly. This allows for very efficient allocation of data in memory using the structs of arrays (SoA) rather than arrays of structs (AoS) principle, promoting faster memory accessibility.

```cpp
struct Component {
	std::vector<float> I;   // holds all variables I for all entities
}

struct Entity {
	E_TYPE type;
	int id;
}

struct System {
	update()
}
```

So I typical implementation of a network Hodgkin-Huxley neurons could look a follows:

```cpp
std::vector<Entity> entities;    // a vector holding the entities

struct Component neuronState{
	std::vector<double> I;
	std::vector<double> V_m;
}

struct System update() { 
	for (auto i : neurons)
	{
		neuronState.I[i] = C_m * dV_m / dt ...
	}
}
```

### Archetypes

### Multi-Scale Models

## Considerations

### Performance

Performance is key when it comes to simulation of large-scale biophysical models. The ECS system should does be optimized for performance. Especially memory allocation and the critical loops should be very performant.

### Ease of Use

Most biologists are no experts in programming, thus the software should have an easy interface (for example in Python) to implement components and systems.