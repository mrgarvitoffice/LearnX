
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Play, Braces, Code, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Library {
  name: string;
  description: string;
  url: string;
}

const LIBRARIES: Library[] = [
  {
    name: "React & ReactDOM",
    description: "A JavaScript library for building user interfaces.",
    url: "https://unpkg.com/react@18/umd/react.development.js\nhttps://unpkg.com/react-dom@18/umd/react-dom.development.js"
  },
  {
    name: "Vue.js",
    description: "The progressive JavaScript framework for building UIs on the web.",
    url: "https://unpkg.com/vue@3/dist/vue.global.js"
  },
   {
    name: "Bootstrap",
    description: "Powerful, feature-packed frontend toolkit. Includes JS and CSS.",
    url: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css\nhttps://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
  },
  {
    name: "jQuery",
    description: "Fast, small, and feature-rich JavaScript library.",
    url: "https://code.jquery.com/jquery-3.7.1.min.js"
  },
  {
    name: "Tailwind CSS",
    description: "A utility-first CSS framework for rapid UI development (via CDN).",
    url: "https://cdn.tailwindcss.com"
  },
  {
    name: "Font Awesome",
    description: "The web's most popular icon set and toolkit.",
    url: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
  },
  {
    name: "p5.js",
    description: "A JS library for creative coding, with a focus on making coding accessible.",
    url: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.js"
  },
  {
    name: "Anime.js",
    description: "A lightweight JavaScript animation library with a simple, yet powerful API.",
    url: "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"
  },
  {
    name: "Three.js",
    description: "3D graphics library for creating and displaying animated 3D computer graphics.",
    url: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
  },
  {
    name: "D3.js",
    description: "A JavaScript library for producing dynamic, interactive data visualizations.",
    url: "https://d3js.org/d3.v7.min.js"
  },
  {
    name: "GSAP",
    description: "A robust JavaScript toolset that turns developers into animation superheroes.",
    url: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
  },
  {
    name: "Chart.js",
    description: "Simple yet flexible JavaScript charting for designers & developers.",
    url: "https://cdn.jsdelivr.net/npm/chart.js"
  },
   {
    name: "Axios",
    description: "Promise based HTTP client for the browser and node.js.",
    url: "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"
  }
];

const PLAYGROUNDS = [
    { name: "Web Platform", description: "Vanilla HTML, CSS, & JS. The building blocks of the web.", icon: Braces, url: "https://stackblitz.com/edit/web-platform?embed=1&ctl=1&view=editor" },
    { name: "React", description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.", icon: () => <svg role="img" viewBox="0 0 128 128" className="h-5 w-5 fill-cyan-400"><path d="M128 64c0 35.346-28.654 64-64 64S0 99.346 0 64 28.654 0 64 0s64 28.654 64 64zM89.842 58.423c-2.484-9.33-14.93-16.103-14.93-16.103-2.617-1.46-5.233-2.22-5.233-2.22s-2.75-1.12-2.75-2.24c0-3.36 9.87-3.92 9.87-3.92s9.462.623 9.462-2.823c0-3.447-1.493-5.02-1.493-5.02s-2.01-1.493-4.74-1.493c-2.73 0-14.425 2.507-14.425 10.603 0 8.096 14.162 9.462 14.162 9.462s3.23 1.107 3.23 2.922c0 1.815-1.493 2.507-1.493 2.507s-4.018 1.494-8.038-.872c-4.018-2.365-5.91-5.61-5.91-5.61s-1.493-2.92-4.132-2.92c-2.64 0-4.132 2.22-4.132 2.22s-2.073 2.92-2.073 6.488c0 3.568 2.073 5.02 2.073 5.02s-2.64 1.748-6.49 1.748c-3.85 0-13.064-3.568-13.064-3.568s-3.448-1.748-3.448-3.35c0-1.604-1.12-2.243-1.12-2.243s-7.14-3.5-12.74-1.4c-5.6 2.1-7.14 8.4-7.14 8.4s-1.815 4.74-8.643 4.74c-6.83 0-9.82-5.6-9.82-5.6s-2.1-3.92-7.56-3.92c-5.46 0-7.84 4.2-7.84 4.2s-2.8 3.08-2.8 8.12c0 5.04 2.8 7.28 2.8 7.28s-3.92 2.52-10.08 2.52c-6.16 0-16.52-5.88-16.52-5.88s-2.24-2.52-4.48-2.52c-2.24 0-3.08 1.4-3.08 1.4s-2.24 3.08-7.28 3.08c-5.04 0-7-3.92-7-3.92s-1.4-1.96-1.4-3.64c0-1.68-1.4-2.24-1.4-2.24s-4.76-1.12-9.52.84c-4.76 1.96-6.44 5.32-6.44 5.32s-1.68 3.08-4.48 3.08-4.48-1.96-4.48-1.96-2.52-2.8-2.52-6.16c0-3.36 2.24-5.32 2.24-5.32s3.08-2.24 6.72-2.24c3.64 0 10.08 3.36 10.08 3.36s4.76 2.8 4.76 4.76c0 1.96-.84 2.8-1.12 3.08-.28.28-4.48 3.36-12.04 1.12-7.56-2.24-10.64-9.8-10.64-9.8s-2.24-5.6-9.24-5.6c-7 0-10.64 5.88-10.64 5.88s-3.36 4.2-3.36 9.8c0 5.6 3.64 8.68 3.64 8.68s5.32 3.64 12.6 3.64c7.28 0 19.32-7.28 19.32-7.28s2.52-3.08 5.32-3.08c2.8 0 3.64 2.24 3.64 2.24s3.08 3.64 8.4 3.64c5.32 0 7.84-5.04 7.84-5.04s2.52-3.64 2.52-7.56c0-3.92-2.52-6.44-2.52-6.44s-3.08-2.52-7.28-2.52c-4.2 0-11.48 3.92-11.48 3.92s-4.48 2.52-4.48 4.2c0 1.68.84 2.24.84 2.24s6.72 2.8 11.76 0c5.04-2.8 7.28-7.84 7.28-7.84s2.24-5.04 8.12-5.04c5.88 0 8.4 4.76 8.4 4.76z"></path></svg> },
    { name: "Next.js", description: "The React Framework for Production. Great for full-stack web applications.", icon: Code, url: "https://stackblitz.com/edit/nextjs?embed=1&ctl=1&view=editor" },
    { name: "Angular", description: "A platform for building mobile and desktop web applications. Maintained by Google.", icon: () => <svg role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-red-500"><path d="M12 0L.49 3.91l1.64 15.54L12 24l9.87-4.55L23.51 3.91zm0 2.4l8.59 3.23-1.34 12.75L12 21.49V2.4zM12 21.49l-7.25-3.11L3.41 5.63l8.59-3.23zM12 7.55l5.22 1.93-1.2 5.09L12 16.5zm-5.22 1.93L12 7.55v8.95L7.98 14.57z"/></svg>, url: "https://stackblitz.com/edit/angular?embed=1&ctl=1&view=editor" },
    { name: "Vue", description: "An approachable, performant and versatile framework for building web user interfaces.", icon: () => <svg role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-green-500"><path d="M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z"></path></svg>, url: "https://stackblitz.com/edit/vue?embed=1&ctl=1&view=editor" },
    { name: "SvelteKit", description: "A framework for building robust, scalable web applications with Svelte.", icon: () => <svg role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-orange-500"><path d="M24 12.004c0 2.29-1.05 4.38-2.71 5.8-1.07.92-2.38 1.57-3.8 1.91l.01-.01c.7-.24.79-1.2.2-1.74l-.84-.79c-.58-.54-1.46-.4-2.02.32l-1.44 1.83c-.56.71-1.54.91-2.39.49l-4.56-2.2c-.85-.42-1.33-1.32-1.12-2.25l.63-2.82c.21-.94.97-1.63 1.91-1.77l8.28-1.26c.94-.14 1.8.49 2.05 1.41l.06.2c.28 1.05-.33 2.1-1.38 2.38l-4.53 1.15c-.1.02-.17.1-.15.2l.63 2.82c.04.16.2.25.35.18l4.56-2.2c.16-.08.23-.28.15-.44l-.2-.74-2.45-8.99A6.8 6.8 0 0111.99.27L12 .27a6.8 6.8 0 016.54 8.35L17.7 11.1c-1.05.27-2.1-.33-2.38-1.38l-.2-.74a.85.85 0 011.41-1l2.45 8.99Z"/></svg>, url: "https://stackblitz.com/edit/sveltekit-starter?embed=1&ctl=1&view=editor" },
    { name: "Node.js", description: "A JavaScript runtime built on Chrome's V8 JavaScript engine for server-side code.", icon: Database, url: "https://stackblitz.com/edit/node?embed=1&ctl=1&view=editor" },
];

const PlaygroundLauncher: React.FC<{ playground: typeof PLAYGROUNDS[number] }> = ({ playground }) => (
    <Dialog>
        <DialogTrigger asChild>
            <div className="p-2.5 rounded-md bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-blue-400"><playground.icon /></div>
                        <div>
                            <h4 className="font-semibold text-gray-200">{playground.name}</h4>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{playground.description}</p>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 group-hover:text-white">
                        <Play className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] p-0 border-gray-700 bg-[#1e1e1e] flex flex-col">
            <DialogHeader className="p-2 border-b border-gray-800 flex-row items-center justify-between">
                <DialogTitle className="text-gray-200 flex items-center gap-2 text-base">
                    <playground.icon /> {playground.name} Playground
                </DialogTitle>
                <DialogClose className="text-gray-400 hover:text-white" />
            </DialogHeader>
            <div className="flex-1 w-full h-full">
                <iframe
                    src={playground.url}
                    width="100%"
                    height="100%"
                    style={{ border: '0', overflow: 'hidden' }}
                    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                />
            </div>
        </DialogContent>
    </Dialog>
);


interface ExtensionsPanelProps {
  onAddLibrary: (url: string, name: string) => void;
}

const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ onAddLibrary }) => {
  return (
    <div className="flex flex-col h-full text-sm">
      <Tabs defaultValue="libraries" className="flex-1 flex flex-col min-h-0">
        <TabsList className="bg-transparent justify-start px-2 border-b border-gray-900/50 rounded-none flex-shrink-0">
          <TabsTrigger value="libraries" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white">Libraries</TabsTrigger>
          <TabsTrigger value="playground" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white">Playground</TabsTrigger>
        </TabsList>

        <TabsContent value="libraries" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full p-2">
            <div className="space-y-2">
              <div className="pb-2">
                <h3 className="font-semibold text-gray-200">Add External Libraries</h3>
                <p className="text-xs text-gray-500 mt-1">Click to add a library's script tag to your `index.html` file.</p>
              </div>
              {LIBRARIES.map(lib => (
                <div key={lib.name} className="p-2 rounded-md bg-gray-700/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-200">{lib.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{lib.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-green-400"
                      onClick={() => onAddLibrary(lib.url, lib.name)}
                      title={`Add ${lib.name}`}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="playground" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full p-2">
            <div className="space-y-2.5">
              <div className="pb-2">
                <h3 className="font-semibold text-gray-200">Advanced Playgrounds</h3>
                <p className="text-xs text-gray-500 mt-1">Launch a full-featured StackBlitz environment.</p>
              </div>
              {PLAYGROUNDS.map(pg => <PlaygroundLauncher key={pg.name} playground={pg} />)}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExtensionsPanel;
