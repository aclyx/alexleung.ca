---
title: "Structural Reasoning About Deep Networks"
date: "2026-02-15"
updated: "2026-02-15"
excerpt: "Chapter 6 sharpened how I think about architecture as a structural assumption, not just a tuning choice."
coverImage: "/assets/blog/structural-reasoning-about-deep-networks/cover.webp"
tags:
  - "Deep Learning"
  - "ML Theory"
  - "Book Notes"
series: "Deep Learning Notes"
seriesOrder: 2
---

Working through Chapter 6, _Deep Feedforward Networks_, sharpened how I reason about neural networks. It did not expand my practical toolkit so much as clarify what I mean when I talk about architecture. After completing coursework like the DeepLearning.AI specialization, I was comfortable training multilayer perceptrons and reasoning about gradients. What this chapter made sharper is that architecture is not just a tuning dimension. It is a structural assumption about the function class we are willing to search.

## Existence Does Not Imply Learnability

I used to carry a simplified version of the Universal Approximation Theorem: neural networks can approximate any function. Chapter 6 makes explicit that this is an existence result about representational capacity, not a statement about efficiency or trainability.

Three distinctions became sharper for me. First, representational capacity: what functions are expressible in principle. Second, parameter efficiency: how many units are required to represent them. Third, learnability: whether optimization can reliably discover those parameters from data. The theorem addresses only the first.

This distinction matters when comparing shallow and deep networks. A single hidden layer network can approximate complex structured functions, but the width required may scale exponentially for certain compositional forms. Depth can reduce parameter count by reusing intermediate computations. In that sense, depth changes scaling behavior, not just capacity.

The most useful refinement was separating topology from optimization. The architecture defines the hypothesis class; gradient descent explores it imperfectly. The fact that a function is representable says nothing about whether it is practically learnable. That separation now anchors how I evaluate model design choices.

## Linear Layers, Factorization, and Parameter Efficiency

One result I had not internalized before is what happens when we stack linear layers without nonlinearities between them. Two consecutive linear transformations collapse into a single linear transformation. Functionally, nothing changes, but the parameterization does.

If a weight matrix $W \in \mathbb{R}^{m \times n}$ is factored as $W = AB$ with $A \in \mathbb{R}^{m \times r}$ and $B \in \mathbb{R}^{r \times n}$, we have expressed the same linear map with a rank constraint and potentially far fewer parameters when $r \ll \min(m, n)$. In other words, depth without nonlinearity induces a low-rank factorization.

I was familiar with LoRA in large language models, but I had mentally categorized it as a fine-tuning trick rather than a direct consequence of basic feedforward structure. Chapter 6 makes the underlying principle obvious: inserting a bottleneck linear layer is equivalent to imposing a low-rank constraint on the effective weight matrix. Two layers without an activation are simply a factorization.

This reframed low-rank adaptation for me. It is not an exotic modification; it is a structural parameterization choice. The architecture itself encodes a rank prior.

## Softplus vs ReLU

The comparison between softplus and ReLU corrected an intuition I had inherited from smooth optimization: smoother functions should be easier to train. Softplus is differentiable everywhere with nonzero gradient, while ReLU is nondifferentiable at zero and flat for negative inputs. By a classical smoothness criterion, softplus seems preferable.

Empirically, ReLU often performs better. Chapter 6 provides a structural explanation. ReLU induces sparsity through hard gating, effectively selecting a subnetwork conditioned on the input. The resulting function is piecewise linear—globally nonlinear, but locally linear within each region. Optimization proceeds largely within these regions, with boundary crossings relatively rare in high dimensions.

Smoothness alone does not determine learnability. Geometry, sparsity, and gating behavior shape gradient flow and effective model complexity. That realization made me more cautious about mapping classical smooth optimization intuitions directly onto deep networks.

## What changed in my mental model

Finishing Chapter 6 did not make me more confident in tuning models; it made me more precise in how I reason about them. I think less in terms of "can this network approximate the function?" and more in terms of parameter efficiency, structural priors, and the separation between representation and optimization. Neural networks feel less like universal approximators and more like structured hypothesis classes with specific geometric and algebraic constraints.
