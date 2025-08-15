---
layout: post
title: Representing Multi-Scale Systems using Directed Acyclic Graphs
description: Representing Multi-Scale Systems using Directed Acyclic Graphs
summary: Representing Multi-Scale Systems using Directed Acyclic Graphs
comments: true
tags: [systems biology, software]
---

In many disciplines it is important to understand the relation between features at different scales. For example, in biophysical models one might like to understand the effect of molecular interactions on macro-scale muscle contractions. These scales depend on different dynamics and contexts. To integrate both one could build simulators for both systems, the molecular and muscle dynamics, and communicate the features of interest.
This design is however very inflexible, can be non-performant, and not easily extendable. For example, to add more muscle tissue, both systems need to change their number of variables, which introduces suboptimal memory allocations of those variables. Scatered memory allocations of similar variables makes that it becomes more work to optimize for SIMD operations on vectors of data. In this article I explore what I learned from reading up on multi-scale system design and an alternative approach to managing a large system of variables. We will end up with a data structure which implements a directed-acyclic graph allowing fast random access to component data and SIMD optimized vectors holding component data allowing fast iterations on the component data.

> Code blocks are written in the `zig` language, so don't forget to `const std = @import("std");`. However, the concepts discussed are general and translates to any systems programming language.

## Variables, Collections and Components

Inspired by component system architectures I believe it is generally a good approach to represent both variables and collections of variables (e.g. a cell, a membrane, a muscle) using unique IDs. Using such handles defining a model becomes a question of moving around such IDs. This way we separate the actual allocation of the model data from the design.

Generating unique IDs could be done with this pattern:

```zig
fn genID() usize {
    const S = struct {
        var uid: std.atomic.Value(usize) = std.atomic.Value(usize).init(0);
    };
    return S.uid.fetchAdd(1, .monotonic);
}
```
`uid` increments atomically each time `genID()` is called ensuring unique IDs.
Component specific information can then be kept using arrays of `enums`:
```zig
const ComponentType enum {
    Inactive,
    Variable,
    Parameter,
    Collection,
};
```
Now we have a way of creating model components as simple entities.
```zig
test "create components" {
    const capacity: usize = 10; // max number of components
    const components: [capacity]ComponentType;

    const x = genID();
    const y = genID();
    const z = genID();

    // position
    components[x] = Variable;
    components[y] = Variable;
    components[z] = Variable;

    try expect(x == 0);
    try expect(y == 1);
    try expect(z == 2);
}
```
What is nice about using integers as handles for data components is that we have separated the model structure from the actual implemenation of the systems that operate on the data. As humans we often like to model systems as we see them in nature, with clearly defined *physical* boundaries and dynamics which only depend on the local neighborhood of a component. So updating a state of a such a large system one timestep forward means going through all sub-components and updating the states according to local update rules. However, computers like to do a lot of similar operations at once and perform vectorized operations where possible. Therefore optimizations on multi-scale systems often come in the form of alligning the data to SIMD registers to optimize data throughput when integrating over time. A consequence is that the code loses some of it's human readability and extendability. Each time a researcher wants to add a new component, change a system, or which systems affect which components the researcher needs to reconsider if the optimizations performed earlier are still valid. By splitting the model structure from the implementation a researcher can work separatly on the implementation of the systems which control the dynamics of the systems while maintaining a flexible way of constructing the model and the relations between components in a human readable fashion.

> The remaining of this article describes how on the model structure side the relations between model components can be defined and how the directed acyclic graph is constructed. In a follow-up article I'll describe how to optimization techniques for fast execution of dynamical systems type integration of the component data.

## The Multi-Scale Graph
We can implement functionality to build associations between components. To build such associations we need a container to store these relations, an adjacency matrix (`relations`). For convenience we store the components and relations in a struct.
```zig
    const Registry = struct {
        components = [usize]ComponentType;
        relations  = [usize][usize]i32;

        usize size;
        usize capacity;

        pub fn has(usize id) bool {
            return id < capacity && components[id] != Inactive;
        };

        pub fn add(ComponentType ctype) usize {
            usize id = genID();
            components[id] = ctype;
            size++;
            return id;
        };
    }
```
By default all entries are `0`. Each component can parent a _child_ component as long as the _child_ component is not already a parent of the _parent_ or is down stream in the ancestry-tree of the _child_. This ensures the acyclic property and enforces the hierarchical nature of the graph. Multi-scale models often have a hierarchical tree like structure in which components at a higher abstraction level contain many similar components at a lower abstraction level. Therefore the directed acyclic graph structure is ideal to represent such an architecture. We can provide easy to use functionality to build up the graph by providing the `give` and `assemble` functions below.
```zig

pub fn give(Registry reg, usize parent, usize child, i32 copies) bool {
    if (!reg.has(parent)) {
        return false;
    }
    if (!reg.has(child)) {
        return false;
    }
    if (!has_parent(reg, parent, child)) {
        return false;
    }
    reg.relations[parent, child] = copies;
    return true;
};

pub fn assemble(Registry reg, []usize children, i32 copies) bool {
    parent = reg.add(Collection);
    for (children) |child| {
        if (!give(reg, parent, child, copies)) {
            return false;
        }
    }
    return true;
}
```
As one can see we need some additional functionality to get save registration of relations between components. By save I mean we would not want circular relations between components. For example, we would like to make a `leaf` and a `root` children of a `tree`, but then it should be prevented to connect `root` and `leaf`:
```zig
test "give components" {

    Registry reg;
    reg.capacity = 2;
    tree = reg.add(Variable);
    leaf = reg.add(Variable);
    root = reg.add(Variable);

    try expect(give(reg, tree, leaf, 50));
    try expect(give(reg, tree, root, 1));
    try expect(give(reg, leaf, root, 1));   // should fail because we prevent circular dependencies.
}
```
