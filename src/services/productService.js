// src/services/productService.js
import supabase from '../utils/supabaseClient'
import { deleteCategory } from './categoryService'

/**
 * Create a new product
 * @param {Object} productForm
 * @returns {Promise<Object>} inserted product
 */
export const createProduct = async (productForm) => {
  const { name, price, imageUrl, imageAlt } = productForm

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        title: name,
        price: parseFloat(price),
        image_url: imageUrl,
        image_alt: imageAlt,
        categoryIds: productForm.categoryIds || [],
        
      },
    ]).select()

  if (error) throw error
  return data[0]
}

/**
 * Fetch all products from Supabase
 * @returns {Promise<Array>}
 */
export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Fetch a single product by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const getProductById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing product
 * @param {string} id
 * @param {Object} productForm
 */
export const updateProduct = async (id, productForm) => {
  const { name, price, imageUrl, imageAlt } = productForm

  const { error } = await supabase
    .from('products')
    .update({
      title: name,
      price: parseFloat(price),
      image_url: imageUrl,
      image_alt: imageAlt,
      categoryIds: productForm.categoryIds || [],
  
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Delete a product by ID
 * @param {string} id
 */
export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}
