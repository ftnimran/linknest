import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

// FIX: isLoading prop add kiya gaya
const SortableItem = ({ id, link, onDelete, isLoading }) => {
  // FIX: dnd-kit ke hook me disabled: isLoading pass kiya gaya, jisse drag hamesha ke liye block ho jayega jab spinner ghumega
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: isLoading });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between bg-[#0a2336] p-3 rounded-lg border mb-3 shadow-sm transition-colors z-10 ${isLoading ? 'border-cyan-500/10' : 'border-cyan-500/30 hover:border-cyan-400'}`}
    >
      <div className="flex items-center gap-3 w-full">
        <button 
          {...attributes} 
          {...listeners} 
          type="button"
          disabled={isLoading}
          className={`p-2 touch-none transition-colors ${isLoading ? 'opacity-30 cursor-not-allowed text-cyan-500' : 'cursor-grab active:cursor-grabbing text-cyan-500/50 hover:text-cyan-400'}`}
          title="Drag to reorder"
        >
          <GripVertical size={20} />
        </button>
        
        <div className="flex-1 overflow-hidden">
          <p className={`font-semibold text-sm truncate transition-colors ${isLoading ? 'text-gray-500' : 'text-white'}`}>{link.title}</p>
          <p className={`text-xs truncate transition-colors ${isLoading ? 'text-gray-600' : 'text-gray-400'}`}>{link.url}</p>
        </div>
        
        <button 
          type="button"
          onClick={() => onDelete(id)} 
          disabled={isLoading}
          className={`transition-colors p-2 ${isLoading ? 'opacity-30 cursor-not-allowed text-red-500' : 'text-red-400 hover:text-red-500 cursor-pointer'}`}
          title="Delete link"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

// FIX: isLoading prop yahan bhi receive kiya gaya
const DraggableLinkList = ({ links, setLinks, isLoading }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    // Agar saving chal rahi hai toh drag complete function block karein
    if (isLoading) return; 

    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((i) => i.id === active.id);
      const newIndex = links.findIndex((i) => i.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newArray = arrayMove(links, oldIndex, newIndex);
        setLinks(newArray);
      }
    }
  };

  if (!links || links.length === 0) {
    return (
      <div className="w-full mt-4 p-6 bg-[#0a2336] border border-dashed border-cyan-500/30 rounded-xl text-center">
        <p className="text-gray-400 text-sm">No active links added yet. Click "Add New Link" above to get started!</p>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="w-full mt-2 relative">
          {links.map((link) => (
            <SortableItem 
              key={link.id} 
              id={link.id} 
              link={link} 
              // Delete button click hone par handleLinksSave automatically isLoading trigger kar dega
              onDelete={(id) => setLinks(links.filter((l) => l.id !== id))} 
              isLoading={isLoading} 
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DraggableLinkList;