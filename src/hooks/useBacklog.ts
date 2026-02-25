import { useState, useEffect } from 'react';
import { backlogService, BacklogItem } from '../services/supabase-service';
import { toast } from 'sonner@2.0.3';

export function useBacklog() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load backlog items from Supabase
  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await backlogService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load backlog items:', error);
      toast.error('Failed to load backlog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const addItem = async (item: Omit<BacklogItem, 'id' | 'userId' | 'itemId' | 'createdAtTs'>) => {
    try {
      const newItem: Omit<BacklogItem, 'id' | 'userId'> = {
        itemId: `backlog-${Date.now()}`,
        createdAtTs: Date.now(),
        ...item
      };
      
      const created = await backlogService.create(newItem);
      setItems(prev => [created, ...prev]);
      toast.success('Item added to backlog');
      return created;
    } catch (error) {
      console.error('Failed to add backlog item:', error);
      toast.error('Failed to add item');
      throw error;
    }
  };

  const updateItem = async (itemId: string, updates: Partial<BacklogItem>) => {
    try {
      await backlogService.update(itemId, updates);
      setItems(prev => prev.map(item => 
        item.itemId === itemId ? { ...item, ...updates } : item
      ));
      toast.success('Item updated');
    } catch (error) {
      console.error('Failed to update backlog item:', error);
      toast.error('Failed to update item');
      throw error;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await backlogService.delete(itemId);
      setItems(prev => prev.filter(item => item.itemId !== itemId));
      toast.success('Item deleted');
    } catch (error) {
      console.error('Failed to delete backlog item:', error);
      toast.error('Failed to delete item');
      throw error;
    }
  };

  const getByPriority = (priority: 'low' | 'medium' | 'high') => {
    return items.filter(item => item.priority === priority);
  };

  const getByTag = (tag: string) => {
    return items.filter(item => item.tags.includes(tag));
  };

  const getAllTags = () => {
    const tagSet = new Set<string>();
    items.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    getByPriority,
    getByTag,
    getAllTags
  };
}
