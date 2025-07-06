// categoryService.js
import supabase from '../utils/supabaseClient'

const TABLE_NAME = 'categories'

// Fetch all categories
export async function getAllCategories() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

// Create a new category
export async function createCategory(category) {
  // category is expected to be an object like { name: 'Category Name' }
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([category])
    .select()
    .single()

  if (error) throw error
  return data
}

// Update an existing category by id
export async function updateCategory(id, category) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(category)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete category by id
export async function deleteCategory(id) {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
