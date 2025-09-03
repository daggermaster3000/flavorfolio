'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Upload, Plus, Minus, Sparkles, Loader2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface RecipeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialRecipe?: {
    id: string;
    title: string;
    description: string | null;
    prep_time: number;
    cook_time: number;
    servings: number;
    image_url?: string | null;
    ingredients: string[];
    steps: string[];
    step_items?: Array<{ text: string; image_url?: string | null }> | null;
    tags?: string[];
  } | null;
}

export function RecipeForm({ onClose, onSuccess, initialRecipe }: RecipeFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialRecipe?.image_url ?? null);
  
  // TikTok parsing state
  const [tiktokLink, setTiktokLink] = useState('');
  const [parsingRecipe, setParsingRecipe] = useState(false);
  
  const [formData, setFormData] = useState({
    title: initialRecipe?.title || '',
    description: initialRecipe?.description || '',
    prep_time: initialRecipe?.prep_time ?? 0,
    cook_time: initialRecipe?.cook_time ?? 0,
    servings: initialRecipe?.servings ?? 1,
  });
  
  const [ingredients, setIngredients] = useState(initialRecipe?.ingredients?.length ? initialRecipe.ingredients : ['']);
  const [tags, setTags] = useState<string[]>(Array.isArray(initialRecipe?.tags) ? initialRecipe.tags : []);
  const [tagInput, setTagInput] = useState('');
  const [steps, setSteps] = useState(initialRecipe?.steps?.length ? initialRecipe.steps : ['']);
  const [stepItems, setStepItems] = useState<Array<{ text: string; image_url?: string | null }>>(
    initialRecipe?.step_items && initialRecipe.step_items.length
      ? initialRecipe.step_items
      : (initialRecipe?.steps?.length ? initialRecipe.steps.map((t) => ({ text: t })) : [{ text: '' }])
  );
  const [stepImageFiles, setStepImageFiles] = useState<Array<File | null>>(
    new Array(stepItems.length).fill(null)
  );




  // Function to parse TikTok recipe
  const parseTikTokRecipe = async () => {
    if (!tiktokLink.trim()) return;
    
    setParsingRecipe(true);
    try {
      // Extract description from TikTok link (this is a simplified approach)
      // In a real implementation, you might want to use TikTok's API or web scraping

      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tiktokUrl: tiktokLink }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse recipe');
      }

      const recipeData = await response.json();
      console.log(recipeData)
      
      // Populate the form with parsed data
      const htmlDescription = `
  <p>
    ${recipeData.description || ''} 
    <a href="${recipeData.tiktok_url}" style="color: blue; text-decoration: underline;" target="_blank" rel="noopener noreferrer">
      View on TikTok
    </a>
  </p>
`;


      setFormData({
        title: recipeData.title,
        description: htmlDescription,
        prep_time: recipeData.prep_time,
        cook_time: recipeData.cook_time,
        servings: recipeData.servings,
      });
      
      setIngredients(recipeData.ingredients.length > 0 ? recipeData.ingredients : ['']);
      setSteps(recipeData.steps.length > 0 ? recipeData.steps : ['']);
      setStepItems(recipeData.steps.length > 0 ? recipeData.steps.map((s: string) => ({ text: s })) : [{ text: '' }]);
      setStepImageFiles(new Array(recipeData.steps.length > 0 ? recipeData.steps.length : 1).fill(null));
      setTags(recipeData.tags);
      
      // Clear the TikTok link
      setTiktokLink('');
      
    } catch (error) {
      console.error('Error parsing TikTok recipe:', error);
      alert('Failed to parse recipe. Please try again or fill in the form manually.');
    } finally {
      setParsingRecipe(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, '']);
    setStepItems([...stepItems, { text: '' }]);
    setStepImageFiles([...stepImageFiles, null]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    setStepItems(stepItems.filter((_, i) => i !== index));
    setStepImageFiles(stepImageFiles.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
    const updatedItems = [...stepItems];
    updatedItems[index] = { ...updatedItems[index], text: value };
    setStepItems(updatedItems);
  };

  const handleStepImageChange = (index: number, file: File | null) => {
    const files = [...stepImageFiles];
    files[index] = file;
    setStepImageFiles(files);
    if (!file) {
      const items = [...stepItems];
      items[index] = { ...items[index], image_url: null };
      setStepItems(items);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Handle image upload if there's a new image
      let imageUrl = initialRecipe?.image_url || null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Handle step image uploads
      const stepImageUrls: Array<{ text: string; image_url?: string | null }> = [];
      for (let i = 0; i < stepItems.length; i++) {
        const stepItem = stepItems[i];
        const stepImageFile = stepImageFiles[i];
        
        if (stepImageFile) {
          const fileExt = stepImageFile.name.split('.').pop();
          const fileName = `${user.id}/steps/${Date.now()}_${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(fileName, stepImageFile);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(fileName);
          
          stepImageUrls.push({ text: stepItem.text, image_url: publicUrl });
        } else {
          stepImageUrls.push({ text: stepItem.text, image_url: stepItem.image_url || null });
        }
      }

      const recipeData = {
        title: formData.title,
        description: formData.description,
        ingredients: ingredients.filter(i => i.trim()),
        steps: steps.filter(s => s.trim()),
        step_items: stepImageUrls,
        tags: tags.filter(t => t.trim()),
        image_url: imageUrl,
        prep_time: formData.prep_time,
        cook_time: formData.cook_time,
        servings: formData.servings,
        user_id: user.id,
        author_id: user.id,
        author_name: user.user_metadata?.username || user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
      };

      if (initialRecipe?.id) {
        // Update existing recipe
        const { error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', initialRecipe.id);

        if (error) throw error;
      } else {
        // Create new recipe
        const { error } = await supabase
          .from('recipes')
          .insert([recipeData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Error saving recipe: ' + err.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-black uppercase font-mono">{initialRecipe ? 'Edit Recipe' : 'Add Recipe'}</h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-bold tracking-wide text-black uppercase mb-4 font-mono">
            Photo
          </label>
          <div className="border-2 border-dashed border-black p-8 text-center">
            {imagePreview ? (
              <div className="relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full h-48 object-cover border border-black"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <div>
                  <label className="cursor-pointer font-medium text-black hover:text-red-500 transition-colors uppercase tracking-wide font-mono">
                    Upload Photo
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TikTok Recipe Parser */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 hidden text-pink-600" />
                <h3 className="text-sm font-bold tracking-wide text-pink-800 uppercase font-mono">
                  AI Recipe Parser
                </h3>
              </div>
              <p className="text-sm text-pink-700 mb-3">
                Paste a TikTok recipe link and let AI extract the recipe details for you!
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tiktokLink}
                  onChange={(e) => setTiktokLink(e.target.value)}
                  placeholder="Paste TikTok recipe link here..."
                  className="flex-1 px-3 py-2 border border-pink-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                />
                <button
                  type="button"
                  onClick={parseTikTokRecipe}
                  disabled={!tiktokLink.trim() || parsingRecipe}
                  className="px-1 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  {parsingRecipe ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 " />
                      Parse 
                    </>
                  )}
                </button>
              </div>
            </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
              Recipe Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter recipe name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
              Servings
            </label>
            <input
              type="number"
              value={formData.servings}
              onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
              min="1"
              className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
              Prep Time (min)
            </label>
            <input
              type="number"
              value={formData.prep_time}
              onChange={(e) => setFormData({ ...formData, prep_time: parseInt(e.target.value) })}
              min="0"
              className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
              Cook Time (min)
            </label>
            <input
              type="number"
              value={formData.cook_time}
              onChange={(e) => setFormData({ ...formData, cook_time: parseInt(e.target.value) })}
              min="0"
              className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
            Description
          </label>
          <RichTextEditor
            content={formData.description}
            onChange={(content) => setFormData({ ...formData, description: content })}
            
          />
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold tracking-wide text-black uppercase font-mono">
              Ingredients
            </label>
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center space-x-2 px-3 py-1 text-xs font-bold tracking-wide text-black border border-black hover:bg-black hover:text-white transition-colors uppercase font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder={`Ingredient ${index + 1}`}
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold tracking-wide text-black uppercase font-mono">
              Tags
            </label>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
                  setTagInput('');
                }
              }}
              placeholder="Add a tag and press Enter"
              className="flex-1 px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              type="button"
              onClick={() => {
                if (tagInput.trim() && !tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
                setTagInput('');
              }}
              className="px-3 py-2 text-xs font-bold tracking-wide text-black border border-black hover:bg-black hover:text-white transition-colors uppercase font-mono"
            >
              Add Tag
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-2 py-1 text-xs border border-black uppercase font-mono">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold tracking-wide text-black uppercase font-mono">
              Instructions
            </label>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center space-x-2 px-3 py-1 text-xs font-bold tracking-wide text-black border border-black hover:bg-black hover:text-white transition-colors uppercase font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-sm font-bold text-black mt-3 min-w-[2rem] font-mono">
                  {index + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    placeholder={`Step ${index + 1}`}
                  />
                  <div className="flex items-center space-x-3">
                    {stepItems[index]?.image_url ? (
                      <div className="relative">
                        <img src={stepItems[index]?.image_url as string} alt="Step" className="w-24 h-24 object-cover border border-black" />
                        <button
                          type="button"
                          onClick={() => {
                            handleStepImageChange(index, null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-sm font-medium text-black hover:text-red-500 transition-colors uppercase tracking-wide font-mono">
                        Add Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleStepImageChange(index, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors mt-1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4 pt-8 border-t border-black">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 text-sm font-bold tracking-wide text-black border border-black hover:bg-gray-100 transition-colors uppercase font-mono"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-black text-white text-sm font-bold tracking-wide hover:bg-gray-900 disabled:opacity-50 transition-colors uppercase font-mono"
          >
            {loading ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </form>
    </div>
  </div>
  );
}