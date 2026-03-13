# EarthFlow Frontend

A modern, high-performance geospatial workflow editor inspired by n8n and Excalidraw. 

## Key Features

- **Full-Screen Canvas**: Interactive playground powered by [React Flow](https://reactflow.dev/).
- **Scalable Node Registry**: Centralized architecture supporting 100+ geospatial node types.
- **Node Library**: Categorized, collapsible sidebar with drag-and-drop functionality.
- **Premium UI**: Crafted with [Tailwind CSS v4](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) for a sleek, dark-mode-first experience.
- **Dynamic Previews**: Integrated map panel for real-time geospatial data visualization (Milestone 4).

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling**: Tailwind CSS v4
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: shadcn/ui

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Node Architecture

Nodes are defined in a centralized [registry](src/lib/workflow-registry.ts) and rendered via a generic `BaseNode` component. This ensures visual consistency and makes adding new processing steps as simple as adding a configuration object.
