---
title: "Depth Changes Scaling, Not Just Capacity"
date: "2026-02-15"
updated: "2026-08-29"
excerpt: "Chapter 6 separates representational capacity, parameter efficiency, and learnability—and shows why depth changes scaling, not just expressiveness."
coverImage: "/assets/blog/structural-reasoning-about-deep-networks/cover.webp"
coverAlt: "Illustration of Alex studying neural network diagrams beside a lake"
tags:
  - "Deep Learning"
  - "Book Notes"
series: "Deep Learning Notes"
seriesOrder: 2
---

[Chapter 6, _Deep Feedforward Networks_](https://www.deeplearningbook.org/contents/mlp.html), separates what a network can represent from how efficiently it can represent it and whether optimization can find the parameters.

## Existence Does Not Imply Learnability

The common shorthand for the Universal Approximation Theorem is that neural networks can approximate any function. Chapter 6 makes the important constraint explicit: this is an existence result about representational capacity, not a statement about efficiency or trainability.

A single hidden layer network can approximate complex structured functions, but the width required may scale exponentially for certain compositional forms. Depth can reduce parameter count by reusing intermediate computations. In that sense, depth changes scaling behavior, not just capacity.

## Linear depth imposes a rank constraint

When we stack linear layers without nonlinearities between them, two consecutive linear transformations collapse into a single linear transformation. Functionally, nothing changes, but the parameterization does.

If a weight matrix $W \in \mathbb{R}^{m \times n}$ is factored as $W = AB$ with $A \in \mathbb{R}^{m \times r}$ and $B \in \mathbb{R}^{r \times n}$, we have expressed the same linear map with a rank constraint and potentially far fewer parameters when $r \ll \min(m, n)$. In other words, a linear path with a narrow intermediate layer induces a low-rank factorization.

The same structure shows up in LoRA-style adaptation for large language models. Inserting a bottleneck linear path imposes a low-rank constraint on the effective weight update. The connection is basic linear algebra: the architecture changes the parameterization of the update.

## Softplus vs ReLU

The comparison between softplus and ReLU corrected an intuition I had inherited from smooth optimization: smoother functions should be easier to train. Softplus is differentiable everywhere with nonzero gradient, while ReLU is nondifferentiable at zero and flat for negative inputs. By a classical smoothness criterion, softplus seems preferable.

Empirically, ReLU often performs better. Chapter 6 provides a structural explanation. ReLU induces sparsity through hard gating, effectively selecting a subnetwork conditioned on the input. The resulting function is piecewise linear: globally nonlinear, but locally linear within each region. The training behavior is not governed by smoothness alone.
