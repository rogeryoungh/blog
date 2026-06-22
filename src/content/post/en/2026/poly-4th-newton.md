---
title: "Fourth-Order Newton Iteration for Power Series: 9.33E inv and 10.33E invsqrt"
pubDate: "2026-06-22"
description: "From order 2 to order 4"
---

Draft...

After translating David Harvey's two papers, namely [Block optimizations for Newton iteration on power series](/en/post/2022/poly-newton/), I have always been curious about the implementation of inv 9E. It is a third-order Newton iteration, so its complexity is a noticeable step below other second-order iterations, and it also remains useful in the block-method setting.

So naturally I had a thought: can there be a fourth-order Newton iteration?

After some thinking, I did manage to derive a $\frac{28}{3}$ E inverse algorithm and a $\frac{31}{3}$ E inverse square root algorithm.

Let me describe the algorithm below. The notation is the same as in the previous post: $\mathsf{E}(n)$ denotes one DFT/IDFT of length $n$.

## Inverse

Assume we already have the first $n$ terms of the inverse of $f$. Let

$$
g_0 = f^{-1} \bmod {x^n}
$$

To extend it to $4n$ terms, suppose $g$ has the form

$$
g = g_0(1 + c_0 x^n + c_1x^{2n} + c_2x^{3n}) + O(x^{4n})
$$

To solve for the polynomials $c_0,c_1,c_2$, we can compute the residual of $f g_0$:

$$
fg_0 = 1 + a_0 x^n + a_1 x^{2n} + a_2 x^{3n} + O(x^{4n})
$$

This gives the equation

$$
fg = (1 + a_0 x^n + a_1 x^{2n} + a_2 x^{3n})(1 + c_0 x^n + c_1x^{2n} + c_2x^{3n}) + O(x^{4n})= 1 + O(x^{4n})
$$

Expanding and comparing coefficients gives

$$
\begin{cases}
a_0 + c_0 = 0 \\
a_1+c_1+ a_0c_0 = 0 \\
a_2+a_1c_0+a_0c_1+c_2 = 0
\end{cases}
\Rightarrow
\begin{cases}
c_0 = -a_0 \\
c_1 = a_0^2 - a_1 \\
c_2 = -a_2 + 2a_0a_1 - a_0^3
\end{cases}
$$

One thing to notice is that each $a_i$ here is a polynomial block of length $n$, so multiplication carries into the next block. We still need to reduce properly. Write

$$
a_0^2 = q_0 + q_1 x^n
$$

Substituting this in gives exactly the formula we need to compute:

$$
\begin{aligned}
\overline{c_0} &= -a_0,\\
\overline{c_1} &= q_0 - a_1,\\
\overline{c_2} &= q_1 - a_2 + a_0(2a_1 - q_0) \bmod x^n.
\end{aligned}
$$

The computation is also fairly clear:

0. We know $g_0 \bmod x^n$.
1. Compute $fg_0 \bmod x^{4n}$, extract $a_0,a_1,a_2$, costing 3E(4n).
2. Compute $a_0^2 = q_0 + q_1x^n$, extract $q_0,q_1$, costing 2E(2n).
3. Compute $a_0(2a_1 - q_0) \bmod x^n$, costing 2E(2n), reusing $\mathcal{F}_{2n}(a_0)$ from the previous step.
4. At this point we obtain $c = \overline{c_0} + \overline{c_1} x^n + \overline{c_2}x^{2n}$.
4. Compute $g_0 c$, costing 2E(4n), reusing $\mathcal{F}_{4n}(g_0)$ from the first step.

In total, the complexity is

$$
T(n) = 3 \mathsf{E}(4n) + 2 \mathsf{E}(2n) + 2 \mathsf{E}(2n) + 2 \mathsf{E}(4n) = 28 \mathsf{E}(n)
$$

Since each iteration sends $n \to 4n$, the complexity is

$$
T(4n) = T (n) + 28 \mathsf{E}(n), \quad T(n) = \frac{28}{3}\mathsf{E}(n) \approx 9.33 \mathsf{E}(n)
$$

## Taylor Expansion

Actually, this equation can be solved more directly. Notice that

$$
C = cx^n = f g_0 - 1 = a_0x^n +a_1x^{2n}+a_2x^{3n} \pmod {x^{4n}}
$$

Now consider the Taylor expansion:

$$
\begin{aligned}
(1+C)^{-1} &= 1 - C + C^2 - C^3 + O(x^{4n}) \\
&= 1 - a_0x^n + (a_0^2-a_1)x^{2n} + (2a_0a_1 - a_0^3-a_2) x^{3n} + O(x^{4n})
\end{aligned}
$$

Then we get the result directly.

## Inverse Square Root

The idea is the same. Assume we already have the first $n$ terms of the inverse square root of $f$. Let

$$
g_0 = f^{-1/2} \bmod {x^n}
$$

Similarly, set

$$
C = cx^n = f g_0^2 - 1 = a_0x^n +a_1x^{2n}+a_2x^{3n} \pmod {x^{4n}}
$$

Taylor expansion gives

$$
\begin{aligned}
(1+C)^{-1/2}
&= 1 - \frac12 C + \frac38 C^2 - \frac{5}{16}C^3 + O(x^{4n}) \\
&= 1 - \frac12(a_0x^n+a_1x^{2n}+a_2x^{3n}) \\
&\quad + \frac38(a_0^2x^{2n}+2a_0a_1x^{3n})
 - \frac{5}{16}a_0^3x^{3n}
 + O(x^{4n}) .
\end{aligned}
$$

As with inverse, each $a_i$ is a polynomial block, so the high half of $a_0^2$ carries into the next block. Again write

$$
a_0^2 = q_0 + q_1x^n.
$$

Then the three blocks in the correction factor

$$
g = g_0(1+c_0x^n+c_1x^{2n}+c_2x^{3n}) + O(x^{4n})
$$

are

$$
\begin{aligned}
\overline{c_0} &= -\frac12 a_0,\\
\overline{c_1} &= -\frac12 a_1 + \frac38 q_0,\\
\overline{c_2} &= -\frac12 a_2 + \frac38 q_1
 + a_0\left(\frac34a_1-\frac{5}{16}q_0\right) \bmod x^n.
\end{aligned}
$$

If we could compute the first three blocks of $C$ directly, we would be done. The problem is that the residual for inverse square root is $fg_0^2-1$, where $g_0^2$ already has $2n$ terms and $f$ has $4n$ terms, so a direct ordinary convolution would need length $8n$. We therefore need a cyclic-convolution trick.

Observe that $f$ times $g_0^2$ has at most 6 terms, and the first term is $1$, so in fact there are only 5 blocks. Thus the $4n$ cyclic convolution can be written as

$$
fg_0^2 \bmod (x^{4n} - 1) = 1 + a_3 + (a_0+a_4)x^n + a_1 x^{2n} + a_2x^{3}
$$

Next we need to extract $a_4$. One way is to compute one more point value:

$$
\begin{aligned}
fg_0^2 \bmod (x^{n} - \xi_8) &= f(\eta x)g_0^2(\eta x) \bmod (x^n - 1) \\
&= 1 + \xi_8 a_0 + \xi_8^2a_1 + \xi_8^3a_2 + \xi_8^4a_3 + \xi_8^5a_4
\end{aligned}
$$

Here $\xi_8$ is an 8th root of unity, $\xi_8^4 = -1$, and $\eta = \xi_{8n}$, i.e. an $8n$-th root of unity. Since $a_1,a_2,a_3$ are not mixed, we can compute $a_0$ from this.

> This trick is essentially the same as the DFT(3n) trick used by inv 9E; here it becomes DFT(4n).

After obtaining $a_0,a_1,a_2$, the rest is basically the same as before, so I will not repeat the details. The concrete computation is:

0. We know $g_0 \bmod x^n$.
1. Compute $fg_0^2 \bmod (x^{4n}-1)$, costing 3E(4n).
2. Use a length-$n$ twisted DFT to compute $fg_0^2$ at $x^n=\eta$, costing 3E(n).
3. Recover $a_0,a_1,a_2$.
4. Compute $a_0^2=q_0+q_1x^n$, costing 2E(2n).
5. Compute $a_0(\frac34a_1-\frac{5}{16}q_0)\bmod x^n$, costing 2E(2n), reusing $\mathcal{F}_{2n}(a_0)$ from the previous step.
6. Form $c=\overline{c_0}+\overline{c_1}x^n+\overline{c_2}x^{2n}$.
7. Compute $g_0c$, costing 2E(4n), reusing $\mathcal{F}_{4n}(g_0)$ from the first step.

Thus one $n\to 4n$ step costs

$$
3\mathsf{E}(4n)+3\mathsf{E}(n)+2\mathsf{E}(2n)+2\mathsf{E}(2n)+2\mathsf{E}(4n)=31\mathsf{E}(n).
$$

So the total complexity is

$$
T(4n)=T(n)+31\mathsf{E}(n),
\quad
T(n)=\frac{31}{3}\mathsf{E}(n)\approx 10.33\mathsf{E}(n).
$$

## Performance Comparison

The NTT modulus is $P=998244353$, and the implementation uses AVX2 optimizations.

### inv

| Algorithm | 1024 us/op | 4096 us/op | 8192 us/op | 65536 us/op | 524288 us/op |
| --- | ---: | ---: | ---: | ---: | ---: |
| inv9e | 8.626 | 38.098 | 80.901 | 780.210 | 7359.195 |
| inv9.33e | 8.146 | 36.459 | 78.166 | 765.066 | 7362.018 |
| inv7.5e | 8.503 | 45.364 | 94.343 | 884.295 | 8058.103 |
| inv12e | 11.197 | 51.168 | 110.128 | 1069.600 | 10351.450 |
| inv10e | 8.395 | 38.762 | 82.788 | 810.673 | 7553.723 |

### invsqrt

| Algorithm | 1024 us/op | 8192 us/op | 65536 us/op | 524288 us/op |
| --- | ---: | ---: | ---: | ---: |
| invsqrt12e | 11.908 | 116.266 | 1114.256 | 10902.573 |
| invsqrt10.33e | 10.012 | 92.285 | 895.062 | 8783.462 |

## Summary

By trying a fourth-order Newton iteration, this post derives a 9.33E algorithm for power series inverse and a 10.33E algorithm for power series inverse square root. The inv algorithm does not improve the theoretical complexity, but its real-machine performance is quite good. For invsqrt, I have not found related literature; perhaps this operator simply does not get much attention. It seems that forums usually use the standard 12E Newton iteration, so this approach might be the first time it appears on the internet.

I also have an idea for an 18E pow algorithm. After I try to verify it, I may submit implementations of the two algorithms in this post to OJ and test them there.
