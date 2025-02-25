---
layout: post
title: Data-Oriented Design for Biophysics
description: Biophysical Modelling can gain a lot from apply Data-Oriented Design Principles.
summary: Biophysical Modelling can gain a lot from apply Data-Oriented Design Principles.
comments: true
tags: [systems biology, ideas]
---

Before modern computing was invented biologists relied on their own eyes and creativity to detect patterns in their data or to develop their theories. Because of the sheer size of the science of life, we have split it up in a range of subfields: from molecular & cellular biology to ecology, evolution and bioinformatics. All these subfields got help from the development of ever more powerful computers. This allowed them to not only test theories about small systems, but integrate evermore data and simulate large models on big compute clusters. These subfields all have their preferred approaches to building models, plus they all rely on different mathematics and physics. For example, computational neuroscientists use ODEs to capture the dynamics of neurons, while tissue modellers might work with agent-based models. Each subfield has created their own software frameworks to build their models in, which has been very beneficial for pushing the respective research forward. 

But what if we want to build multi-scale models? In the 21th century we are seeing a push for the development of digital twins of the human body. The promise of digital twins is that they allow for integration of data from multiple scales. For example, a digital twin should allow for the integration blood sample data while also taking incorporating an fMRI scan *in the same model!* As you can imagine those measurements record signals which are produced by very different mechanisms and systems. How do we build truly multi-scale and multi-system models? I think we can take inspiration from data-oriented design principles, a philosophy in software engineering for highly performant and flexible applications.

## Data-Oriented Design
Data-Oriented Design (DOD) is a paradigm in software engineering that emphasizes the organization of code and data structures to maximize performance and efficiency. Unlike Object-Oriented Design (OOD), which focuses on encapsulating data and behavior into objects, DOD prioritizes the way data is accessed and processed by the CPU. The core idea is to structure data in a way that aligns with the hardware's capabilities, such as cache utilization and memory access patterns. This often involves organizing data into contiguous blocks and processing it in a linear fashion to minimize cache misses and improve throughput. By focusing on how data flows through the system, DOD can lead to significant performance improvements, especially in computationally intensive applications.

### Compositionality
The data structures in DOD are agnostic of the behaviour of the program. This separation of data and behaviour allows having multiple systems interact with the same data. One can hopefully now see the similarity to biological systems. For example, subcellular mechanisms in muscle cells might be triggered by neural signals from the central nervous system. The subcellular mechanisms might affect the properties of the membrane. *Meanwhile* at the tissue level, these membrane properties affect the stretching physics of a whole tissue. To model such interactions you would like to be able to separate the mechanisms but share the data-structures. That is exactly what DOD allows for. The data is stored in dedicated data-types, while your behavourial logic (e.g. ODE/PDE logic, update rules, etc.) are stored somewhere else but have access to the data. 

### Performance
Well designed software following DOD principles could have performance benefits. Their modularity means that the simulations should be fairly straightforward to parallelize. Here again by design the software is agnostic of how you design your simulation loop. You can parallelize some modifications of the data while executing others in series.

---

In follow-up posts I will walk through my early efforts to design a tool for building a system for such multi-scale models using DOD design principles.