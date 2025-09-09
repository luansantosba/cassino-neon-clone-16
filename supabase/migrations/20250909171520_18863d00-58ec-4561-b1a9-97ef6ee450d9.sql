-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Create policies for banner uploads
CREATE POLICY "Anyone can view banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'banners');

CREATE POLICY "Service role can upload banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Service role can update banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'banners');

CREATE POLICY "Service role can delete banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'banners');