---
author: "rogeryoungh"
title: "Non-Recursive DFS Orders on Full Binary Trees"
pubDate: "2024-01-12"
description: "Some neat bit tricks."
---

> Translated by ChatGPT.

[CDQ divide and conquer](https://oi-wiki.org/misc/cdq-divide/) is an idea for merging contributions over a divide-and-conquer process, usually by traversing the recursion tree. The semi-online convolution algorithm also contains this idea, and its recursion tree is a full binary tree.

A long time ago, when I was building semi-online convolution, I wanted to decouple the divide-and-conquer process from the data stream, so I tried to [turn it into a next-style form](https://www.luogu.com.cn/blog/rogeryoungh/ban-zai-xian-juan-ji-di-shi-xian) with bit operations. [@HolyK](https://blog.asukakyle.top/) seems to have noticed this even earlier (the original blog seems to have disappeared), and summarized that quite a few CDQ-style algorithms can use this trick.

When I later studied binary trees for the postgraduate entrance exam, I picked up this idea again. Semi-online convolution only uses inorder traversal; can the other orders be done this way too?

This post mainly summarizes non-recursive implementations on full binary trees, so we require $n$ to have the form $2^k$.

## BFS order

BFS order is level-order traversal, which should be familiar. Iterative FFT usually uses this.

```cpp
void levelorder1(int n) { // bottom-up
  for (int l = 1; l <= n; l *= 2) {
    for (int i = 0; i < n; i += l) {
      std::printf("[%d, %d)\t\n", i, i + l);
    }
  }
}

void levelorder2(int n) { // top-down
  for (int l = n; l >= 1; l /= 2) {
    for (int i = 0; i < n; i += l) {
      std::printf("[%d, %d)\t\n", i, i + l);
    }
  }
}
```

## DFS order

There are three DFS orders:

- Preorder traversal: root, left, right
- Inorder traversal: left, root, right
- Postorder traversal: left, right, root

### Preorder traversal

Notice that the lowbit of the current point indicates the largest interval it covers as the left boundary.

```cpp
void preorder(int n) { // root-left-right
  for (int i = 0; i < n; ++i) {
    int u = i == 0 ? n : (i & -i);
    for (; u > 0; u /= 2) {
      std::printf("[%d, %d)\n", i, i + u);
    }
  }
}
```

### Inorder traversal

Notice that the lowbit of the current point indicates its left and right range.

```cpp
void inorder(int n) { // left-root-right
  for (int i = 1; i < n; ++i) {
    int u = i & -i;
    if (u == 1) {
      std::printf("[%d, %d)\n", i - 1, i);
      std::printf("[%d, %d)\n", i - u, i + u);
      std::printf("[%d, %d)\n", i, i + 1);
    } else {
      std::printf("[%d, %d)\n", i - u, i + u);
    }
  }
}
```

### Postorder traversal

Postorder traversal can be obtained by direct testing.

```cpp
void postorder(int n) { // left-right-root
  for (int i = 1; i <= n; ++i) {
    int u = 1;
    while (true) {
      std::printf("[%d, %d)\n", i - u, i);
      if (u & i)
        break;
      u *= 2;
    }
  }
}
```

## Minimum step length

Sometimes we need optimizations similar to loop unrolling, with a minimum step length added as a control parameter.

### Preorder traversal (step)

```cpp
void preorder(int n, int step = 1) { // root-left-right
  for (int i = 0; i < n; i += step) {
    int u = i == 0 ? n : (i & -i);
    for (; u >= step; u /= 2) {
      std::printf("[%d, %d)\n", i, i + u);
    }
  }
}
```

### Inorder traversal (step)

```cpp
void inorder(int n, int step = 1) { // left-root-right
  for (int i = step; i < n; i += step) {
    int l = i & -i;
    if (l == step) {
      std::printf("[%d, %d)\n", i - step, i);
      std::printf("[%d, %d)\n", i - l, i + l);
      std::printf("[%d, %d)\n", i, i + step);
    } else {
      std::printf("[%d, %d)\n", i - l, i + l);
    }
  }
}
```

### Postorder traversal (step)

```cpp
void postorder(int n, int step = 1) { // left-right-root
  for (int i = step; i <= n; i += step) {
    int l = step;
    while (true) {
      std::printf("[%d, %d)\n", i - l, i);
      if (l & i)
        break;
      l *= 2;
    }
  }
}
```

## Afterword

I wonder whether a non-iterative DFS-order FFT can be worked out.
