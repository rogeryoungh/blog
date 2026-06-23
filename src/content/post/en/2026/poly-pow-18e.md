---
title: "An 18E Block Algorithm for Power Series Power"
pubDate: "2026-06-24"
description: "I did not expect iteration and blocking for pow to combine like this."
---

> Translated by ChatGPT.

Draft...

I finally got something somewhat original done.

In the previous post I wrote about fourth-order Newton iteration, and at the end I mentioned an idea for an 18E pow algorithm. Now I will write it down.

## Problem

Power series power is defined as

$$
g = f^k \bmod {x^n}, \qquad f(0)=1
$$

The most direct method is

$$
g = \exp(k \ln f).
$$

In general, if you use a relatively plain 13E ln and 17E exp, you get a 30E pow algorithm. If you choose the SOTA 10E ln + 11.5E exp, you get a 21.5E pow. In my experiments, 10E ln + 14E exp performs the best in practice, giving a 24E pow.

There are also standalone pow algorithms. The current SOTA is 20.25E. This post proposes a new 18E algorithm for computing power series power.

When I was trying online convolution before, I wondered whether it was possible to maintain the iteration formulas on both sides at the same time and get better complexity. This time I continued along that line and made some progress.

## Blocking

I recommend reading [Block optimizations for Newton iteration on power series](/en/post/2022/poly-newton/). This post uses quite a few conclusions from it.

Let the block length be $m$, and let $X=x^m$. Write

$$
f = f_{[0]} + f_{[1]}X + \cdots,\qquad
g = g_{[0]} + g_{[1]}X + \cdots.
$$

Assume we already know $g_{[0]},\cdots,g_{[s-1]}$, and now want to compute $g_{[s]}$.

In the previous block inverse method, we had the following conclusion. First, let $\psi$ be the convolution of $fg$ without $g_{[s]}$, namely

$$
\psi = (f_{[0..s]}g_{[0..s-1]})_{[s]}
$$

Then we have

$$
\begin{aligned}
(fg)_{[s]} - \psi &=
(f_{[0..s]}g_{[0..s]})_{[s]} - (f_{[0..s]}g_{[0..s-1]})_{[s]} \\
&= (f_{[0..s]} g_{[s]} X^{s})_{[s]} \\
&= f_{[0]} \ast g_{[s]} \bmod X
\end{aligned} \tag{1}
$$

Next we will apply this difference of two convolutions to both sides of the iteration formula.

## Differential Equation

Following the earlier notation, consider the in-place differential operator $\Delta h = xh'(x)$.

For convenience, write $\Delta_i f = X^{-i} \Delta(X^i f)$, i.e. a shifted differential operator. Then

$$
\Delta (f_{[0]} + f_{[1]} X + \cdots) = (\Delta_0 f_{[0]}) + (\Delta_1 f_{[1]}) + \cdots
$$

Consider $g=f^k$. Differentiating both sides gives

$$
f\Delta g = k g \Delta f
$$

Add $g \Delta f$ to both sides:

$$
\Delta(fg) = (k+1)g\Delta f
$$

This equation is more suitable for blocking, because the left side contains $fg$, while the final unknown we need to solve for is the new block of $g$. Its block form is

$$
(\Delta fg)_{[s]} = (k+1)(g \Delta f)_{[s]} \tag{2}
$$

Now consider the two sides when the $s$-th block is missing. On the left side, we maintain $fg$ and apply formula (1), obtaining

$$
(fg)_{[s]} - \psi = f_{[0]}g_{[s]} \bmod X.
$$

For the right side, maintain $g \Delta f$ and apply formula (1) again:

$$
(g \Delta f)_{[s]} - \phi = (\Delta f_{[0]}) g_{[s]} \bmod X
$$

Then using equation (2), we get

$$
\Delta_s (\psi + f_{[0]}g_{[s]}) = (k+1)(\phi + g_{[s]}\Delta f_{[0]}) \pmod X
$$

Now we need to solve for $g_{[s]}$. Solving this directly is difficult: one side contains $g_{[s]}$, while the other contains $\Delta_s g_{[s]}$, so they do not cancel.

Consider the substitution

$$
g_{[s]} = g_{[0]}u.
$$

Since $g_{[0]} = f_{[0]}^k$,

$$
\Delta (f_{[0]}g_{[0]})
= f_{[0]}\Delta g_{[0]} + g_{[0]}\Delta f_{[0]}
= (k+1)g_{[0]}\Delta f_{[0]}.
$$

Also notice that

$$
\begin{aligned}
\Delta_s(f_{[0]}g_{[s]})
&= \Delta_s(f_{[0]}g_{[0]}u) \\
&= f_{[0]}g_{[0]}\Delta_s u + u\Delta (f_{[0]}g_{[0]}) \\
&= f_{[0]}g_{[0]}\Delta_s u + (k+1)g_{[0]} u  \Delta f_{[0]} \\
&= f_{[0]}g_{[0]}\Delta_s u + (k+1)g_{[s]} \Delta f_{[0]}
\end{aligned}
$$

These are exactly the two terms in formula (2), so

$$
f_{[0]}g_{[0]}\Delta_s u = (k+1)\phi - \Delta_s\psi.
$$

That is,

$$
u = \Delta_s^{-1}\left(\frac{(k+1)\phi - \Delta_s\psi}{f_{[0]}g_{[0]}}\right),
\qquad
g_{[s]} = g_{[0]}u.
$$

## Concrete Procedure

The method for computing $\psi$ and $\phi$ is exactly the same as in the previous block method: compute the $s$-th block of $fg$ and $g \Delta f$. Since $g$ is shared, we only need to maintain the block DFTs of $f,\Delta f,g$, and two IDFTs give $\psi$ and $\phi$.

The concrete computation is:

0. Assume $g_{[0]} = f_{[0]}^k$ has already been computed.
1. Compute $\mathcal{F}_{2m}(g_{[0]})$. This 2E cost is counted inside the iteration, so it has no extra cost here.
2. Compute $f_{[0]}g_{[0]} \bmod X$, costing 4E.
3. Precompute $h = (f_{[0]}g_{[0]})^{-1}$ using any 6E algorithm.
4. Compute each block $s$ in order:
   1. Compute $\mathcal{F}_{2m}(f_{[s]})$, $\mathcal{F}_{2m}(\Delta_s f_{[s]})$, and $\mathcal{F}_{2m}(g_{[s-1]})$, costing 6E.
   2. Use block multiplication to compute $\psi$, costing 2E.
   3. Use block multiplication to compute $\phi$, costing 2E.
   4. Compute $\rho = (k+1)\phi - \Delta_s\psi$, linear cost.
   5. Compute $v = h\rho \bmod X$, costing 4E.
   6. Compute $u = \Delta_s^{-1}v$, linear cost.
   7. Compute $g_{[s]} = g_{[0]}u \bmod X$, costing 4E.

In short, the complexity per new block is 18E. When the number of blocks $r \to \infty$, the amortized complexity is also 18E.

Strictly speaking, the complexity satisfies $T(n) \leqslant 18\mathsf{E}(n) + O(n \sqrt{\log n})$.

## Implementation And Tests

The performance test uses NTT modulus $P=998244353$, fixes the exponent to $k=7$, and uses AVX2 optimization.

| Algorithm | 1024 us/op | 8192 us/op | 65536 us/op | 524288 us/op |
| --- | ---: | ---: | ---: | ---: |
| pow24e | 22.407 | 210.397 | 2053.427 | 19850.235 |
| pow18e | 18.233 | 169.529 | 1593.649 | 15228.692 |

The speedup is fairly stable, roughly a bit over 20%, which matches expectation.

## Summary

This started as idle speculation, but the more I thought about it, the more reasonable it became, and eventually it turned into this post. At last, I have made a small thing that is actually my own.
