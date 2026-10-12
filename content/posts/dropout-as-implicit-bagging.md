---
title: "Dropout as Shared-Parameter Bagging"
date: "2026-03-07"
updated: "2026-10-12"
excerpt: "A concrete way to understand dropout in deep learning: sampled subnetworks with shared weights, standing in for a much more expensive ensemble."
coverImage: "/assets/blog/dropout-as-implicit-bagging/cover.webp"
coverAlt: "Illustration of Alex drawing glowing neural network diagrams beside an open Deep Learning book"
tags:
  - "Deep Learning"
  - "Book Notes"
  - "Regularization"
series: "Deep Learning Notes"
seriesOrder: 3
---

When I worked through [Chapter 7 of _Deep Learning_](https://www.deeplearningbook.org/contents/regularization.html), the bagging interpretation of dropout was the most useful part. The shortcut explanation treats dropout as random noise that helps regularization. Chapter 7 gives a more precise model: dropout works like a relatively inexpensive form of model averaging, close in spirit to bagging.

## Dropout approximates model averaging

Bagging reduces variance by averaging predictions from models trained on resampled data. Training and serving separate networks is expensive. Dropout instead samples a different thinned network for each training example while all of those subnetworks share parameters. The [original dropout paper](https://www.jmlr.org/papers/v15/srivastava14a.html) describes using one unthinned network with scaled weights at inference to approximate their combined predictions.

The analogy has a boundary: these are not independently trained models, and a single scaled network does not generally produce their exact average. Chapter 7 derives the weight-scaling rule for a normalized geometric mean of predictions in particular model classes, then treats its use in deep nonlinear networks as an approximation.

Scaling can also happen during training. With a retention probability of `q`, inverted dropout divides retained activations by `q` and applies no dropout scaling at inference. [PyTorch's `Dropout`](https://docs.pytorch.org/docs/stable/generated/torch.nn.Dropout) uses this convention, with `p` defined as the drop probability, so `q = 1 - p`.

## Changing masks discourages co-adaptation

The bagging interpretation also makes another part of dropout easier to think about: the apparent paradox that it can widen the set of subnetworks seen during training while still regularizing. Each binary mask defines a different thinned network, but those networks share weights. At the same time, any one unit cannot rely on a specific partner always being present, so representations are pushed to be useful across many subnet configurations.

That pressure reduces fragile co-adaptation. Features that only work in one narrow pathway get penalized indirectly, while more robust features survive across many sampled masks. I like this framing because it explains dropout through the training setup itself, not just through the shortcut phrase "add noise."
