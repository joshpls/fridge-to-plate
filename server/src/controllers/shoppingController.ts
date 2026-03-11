import type { Request, Response } from 'express';
import * as shoppingService from '../services/shoppingService.js';

export const handleAddToList = async (req: Request, res: Response) => {
  const { userId, items } = req.body;

  if (!userId || !items || !Array.isArray(items)) {
    return res.status(400).json({ status: 'error', message: 'Invalid data provided' });
  }

  try {
    await shoppingService.addItemsToList(userId, items);
    res.status(200).json({ status: 'success', message: 'Items added to grocery list' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update shopping list' });
  }
};

export const getLimit = async (req: Request, res: Response) => {
  const userId = req.params.userId as string; 
  
  try {
    const list = await shoppingService.getShoppingList(userId);
    res.status(200).json({ status: 'success', data: list });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: "Could not retrieve list" });
  }
};

export const toggleStatus = async (req: Request, res: Response) => {
  const itemId = req.params.itemId as string;
  const { bought } = req.body;

  try {
    const updated = await shoppingService.toggleBoughtStatus(itemId, bought);
    res.status(200).json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: "Failed to update item" });
  }
};

export const handleClearList = async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  try {
    await shoppingService.clearShoppingList(userId);
    res.status(200).json({ status: 'success', message: 'List cleared' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to clear list' });
  }
};

export const handleBuyAll = async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  try {
    await shoppingService.buyAllItems(userId);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to process bulk purchase' });
  }
};
