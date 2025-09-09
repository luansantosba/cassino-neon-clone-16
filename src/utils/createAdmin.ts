export const createAdminUser = async () => {
  try {
    const response = await fetch('/functions/v1/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create admin user');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};