---
layout: post
title: Representing Multi-Scale Systems using Directed Acyclic Graphs
description: Representing Multi-Scale Systems using Directed Acyclic Graphs
summary: Representing Multi-Scale Systems using Directed Acyclic Graphs
comments: true
tags: [systems biology, software]
---
In many disciplines it is important to understand the relation between features at different scales. For example, in biophysical models one might like to understand the effect of molecular interactions on macro-scale muscle contractions. These scales depend on different dynamics and contexts. To integrate both one could build simulators for both systems, the molecular and muscle dynamics, and communicate the features of interest.
This design it however very inflexible, can be non-performant, and not easily extendable. For example, to add more muscle tissue, both systems need to change their number of variables, which introduces suboptimal memory allocations of those variables. Scatered memory allocations of similar variables makes that it becomes more work to optimize for SIMD operations on vectors of data. In this article I explore what I learned from reading up on multi-scale system design and an alternative approach to managing a large system of variables.

> code blocks are written in the `zig` language, so don't forget to `const std = @import("std");`. However, the concepts discussed are general and translates to any systems programming language.

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
```uid``` increments atomically each time ```genID()``` is called ensuring unique IDs.

Component specific information can then be kept using arrays of ```enums```:
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
}
```
Now we can implement functionality to build associations between components. We would like to register which components are
