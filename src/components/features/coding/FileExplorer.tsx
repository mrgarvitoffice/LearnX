
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileCode, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileExplorerProps {
  files: string[];
  activeFile: string;
  onSelectFile: (fileName: string) => void;
  onRenameFile: (oldName: string) => void;
  onDeleteFile: (fileName: string) => void;
  children?: React.ReactNode;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFile,
  onSelectFile,
  onRenameFile,
  onDeleteFile,
  children,
}) => {
  return (
    <div className="flex flex-col h-full text-sm font-sans">
      <div className="p-2 border-b border-gray-900/50 flex-shrink-0">
        <h3 className="font-semibold text-gray-200">Files</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-1">
          {files.map(file => (
            <div
              key={file}
              className={cn(
                "group flex items-center w-full justify-start rounded-md transition-colors",
                activeFile === file ? "bg-gray-700" : "hover:bg-gray-700/50"
              )}
            >
              <Button
                variant="ghost"
                className="flex-1 justify-start h-7 px-2 text-sm text-gray-300 hover:bg-transparent"
                onClick={() => onSelectFile(file)}
              >
                <FileCode className="h-4 w-4 mr-2 shrink-0 text-blue-400" />
                <span className="truncate">{file}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()} // Prevent file selection
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem onClick={() => onRenameFile(file)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400"
                    onClick={() => onDeleteFile(file)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
      {children && (
        <div className="pt-2 mt-auto border-t border-gray-900/50 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
