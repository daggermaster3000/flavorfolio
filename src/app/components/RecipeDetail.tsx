'use client';

import React, { useRef } from 'react';
import { Recipe } from '../lib/supabase';
import { X, Clock, Users, Edit3, Trash2, Download } from 'lucide-react';
// No direct import of html2pdf here anymore

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export function RecipeDetail({ recipe, onClose, onEdit, onDelete, readOnly }: RecipeDetailProps) {
  const totalTime = recipe.prep_time + recipe.cook_time;
  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!printRef.current) return;

    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printRef.current;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${recipe.title.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1 }, // keep image crisp
        html2canvas: {
          scale: 4, // higher scale -> sharper images
          useCORS: true, // load external images properly
          logging: false, // suppress console noise
          letterRendering: true, // improves text/image rendering
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      // Ensure images inside the element are fully loaded
      const imgs = element.querySelectorAll('img');
      await Promise.all(
        Array.from(imgs).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve();
              else if (img.naturalWidth > 0) resolve(); // Check if image is already loaded
              else img.onload = () => resolve();
              img.onerror = () => resolve(); // Resolve even if image fails to load
            })
        )
      );

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-6 md:py-10">
      <div className=" top-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-white flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 hover:bg-black hover:text-white transition-colors border border-black text-black"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          
          {!readOnly && (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-wide text-black border border-black hover:bg-black hover:text-white transition-colors uppercase"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-wide text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-colors uppercase"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div ref={printRef} className=" print-container grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12">
        {/* Image */}
        {recipe.image_url && (
          <figure className="lg:col-span-5">
            <div className="aspect-square border border-black">
              <img 
                src={recipe.image_url} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          </figure>
        )}
        
        {/* Recipe Info */}
        <div className={recipe.image_url ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-2 md:mb-3 uppercase font-mono">
            {recipe.title}
          </h1>
          {(recipe.author_name || recipe.author_id) && (
            <div className="mb-4 text-[11px] uppercase tracking-widest text-black/70 font-mono">
              by {recipe.author_name || 'Unknown'}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono uppercase tracking-wide text-black/70 mb-6">
            <div className="inline-flex items-center gap-2"><Clock className="w-4 h-4" /> {totalTime} min total</div>
            <span className="hidden sm:inline-block w-px h-4 bg-black/20" />
            <div className="inline-flex items-center gap-2"><Users className="w-4 h-4" /> Serves {recipe.servings}</div>
          </div>

          {recipe.description && (
            <div 
              className="text-base md:text-lg text-gray-800 mb-8 leading-relaxed prose prose-lg max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-2"
              dangerouslySetInnerHTML={{ __html: recipe.description }}
            />
          )}
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 mb-12 pb-8 border-b border-black/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-black mb-1 font-mono">{recipe.prep_time} min</div>
              <div className="text-[11px] font-bold tracking-wide text-black uppercase font-mono">Prep</div>
            </div>
            <div className="text-center border-l border-r border-black/20 px-2">
              <div className="text-2xl font-bold text-black mb-1 font-mono">{recipe.cook_time} min</div>
              <div className="text-[11px] font-bold tracking-wide text-black uppercase font-mono">Cook</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black mb-1 font-mono">{recipe.servings}</div>
              <div className="text-[11px] font-bold tracking-wide text-black uppercase font-mono">Servings</div>
            </div>
          </div>
          
          {/* Ingredients */}
          <div className="mb-12">
            <h2 className="text-sm font-bold tracking-widest text-black mb-4 uppercase font-mono">Ingredients</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-black"></span>
                  <span className="text-gray-800">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Steps */}
          <div>
            <h2 className="text-sm font-bold tracking-widest text-black mb-4 uppercase font-mono">Instructions</h2>
            <ol className="space-y-8">
              {(recipe.step_items && recipe.step_items.length ? recipe.step_items.map((item) => item.text) : recipe.steps).map((_, index) => (
                <li key={index} className="grid grid-cols-[auto,1fr] gap-4">
                  <div className="pt-0.5">
                    <div className="w-8 h-8 border border-black rounded-full flex items-center justify-center font-mono text-sm font-bold">{index + 1}</div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-800 leading-relaxed">{recipe.step_items && recipe.step_items[index] ? recipe.step_items[index].text : recipe.steps[index]}</p>
                    {recipe.step_items && recipe.step_items[index]?.image_url && (
                      <img
                        src={recipe.step_items[index]?.image_url as string}
                        alt={`Step ${index + 1}`}
                        className="w-full max-w-lg border border-black"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <button
            onClick={handleExportPdf}
            className="sm:inline-flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-wide text-black border border-black hover:bg-black hover:text-white transition-colors uppercase"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}