import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Upload, Image as ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { insertArtifactSchema, Artifact } from "@shared/schema";

// Extend the artifact schema with additional validations
const artifactFormSchema = insertArtifactSchema
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    id_number: z.string().min(2, "ID Number must be at least 2 characters"),
    date_start: z.number().int().optional(),
  })
  .transform((data) => {
    // Ensure nulls are transformed to undefined to satisfy the form requirements
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
    );
  });

type ArtifactFormValues = z.infer<typeof artifactFormSchema>;

interface ArtifactImage {
  id: number;
  artifact_id: number;
  url: string;
  caption: string;
  is_primary: boolean;
}

export default function EditArtifactPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const artifactId = params.id ? parseInt(params.id) : undefined;
  
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<ArtifactImage[]>([]);
  const [model3D, setModel3D] = useState<{ url: string; type: string } | null>(null);

  // Redirect if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Fetch artifact data
  const { data: artifact, isLoading, error } = useQuery({
    queryKey: ['/api/artifacts', artifactId],
    queryFn: async () => {
      if (!artifactId) return undefined;
      const response = await fetch(`/api/artifacts/${artifactId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artifact');
      }
      return response.json();
    },
    enabled: !!artifactId
  });

  // Fetch artifact images
  const { data: imageData } = useQuery({
    queryKey: ['/api/artifacts', artifactId, 'images'],
    queryFn: async () => {
      if (!artifactId) return [];
      const response = await fetch(`/api/artifacts/${artifactId}/images`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      return response.json();
    },
    enabled: !!artifactId,
    onSuccess: (data) => {
      setImages(data);
    }
  });

  // Create form
  const form = useForm<ArtifactFormValues>({
    resolver: zodResolver(artifactFormSchema),
    defaultValues: {
      title: "",
      description: "",
      id_number: "",
      date_start: -1000,
      culture: "",
      materials: [],
      period: "",
      dimensions: "",
      has_3d_model: false,
      provenance: "",
    },
  });

  // Update form values when artifact data is loaded
  useEffect(() => {
    if (artifact) {
      form.reset({
        title: artifact.title || "",
        description: artifact.description || "",
        id_number: artifact.id_number || "",
        date_start: artifact.date_start || undefined,
        culture: artifact.culture || "",
        materials: artifact.materials || [],
        period: artifact.period || "",
        dimensions: artifact.dimensions || "",
        has_3d_model: artifact.has_3d_model || false,
        provenance: artifact.provenance || "",
      });

      if (artifact.model_url && artifact.model_type) {
        setModel3D({
          url: artifact.model_url,
          type: artifact.model_type
        });
      }
    }
  }, [artifact, form]);

  // Handle API submission
  const updateMutation = useMutation({
    mutationFn: async (values: ArtifactFormValues) => {
      if (!artifactId) throw new Error("Artifact ID is required");
      const response = await apiRequest("PATCH", `/api/artifacts/${artifactId}`, values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Artifact updated successfully",
        variant: "default",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts", artifactId] });
    },
    onError: (error: Error) => {
      setSubmissionError(error.message);
    },
  });

  // Handle image upload
  const uploadImage = async (file: File) => {
    if (!artifactId) return;

    setIsUploading(true);
    try {
      // First, get a presigned URL or encode the image as base64
      // For this example, we're using base64 encoding
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Extract the base64 content (remove data:image/jpeg;base64, part)
        const base64Content = base64data.split(',')[1];
        
        const imageData = {
          url: base64data,
          caption: file.name.split('.')[0],
          is_primary: images.length === 0, // First image is primary by default
          artifact_id: artifactId
        };
        
        try {
          const response = await apiRequest("POST", `/api/artifacts/${artifactId}/images`, imageData);
          const newImage = await response.json();
          
          setImages(prev => [...prev, newImage]);
          
          toast({
            title: "Success",
            description: "Image uploaded successfully",
            variant: "default",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  // Handle 3D model upload
  const upload3DModel = async (file: File) => {
    if (!artifactId) return;

    setIsUploading(true);
    try {
      // Determine model type from file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      let modelType = 'obj';  // default
      
      if (extension === 'gltf') modelType = 'gltf';
      else if (extension === 'glb') modelType = 'glb';
      
      // Read the file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        try {
          // Update the artifact with the model information
          const modelData = {
            model_url: base64data,
            model_type: modelType,
            has_3d_model: true
          };
          
          const response = await apiRequest("PUT", `/api/artifacts/${artifactId}/model`, modelData);
          const updatedArtifact = await response.json();
          
          // Update the form state and model state
          setModel3D({
            url: base64data,
            type: modelType
          });
          
          form.setValue("has_3d_model", true);
          
          toast({
            title: "Success",
            description: "3D model uploaded successfully",
            variant: "default",
          });

          // Refresh artifact data
          queryClient.invalidateQueries({ queryKey: ["/api/artifacts", artifactId] });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload 3D model",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading 3D model:", error);
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload 3D model",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  function onSubmit(values: ArtifactFormValues) {
    setSubmissionError(null);
    updateMutation.mutate(values);
  }

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If error, show an error message
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load artifact: {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => navigate("/")}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  // If artifact doesn't exist, show a not found message
  if (!artifact && artifactId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            The artifact you're looking for doesn't exist or you don't have permission to edit it.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => navigate("/")}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  // If the artifact exists but doesn't belong to the user (and user is not curator/admin)
  if (artifact && artifact.user_id !== user.id && user.role !== 'curator' && user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Permission Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to edit this artifact.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => navigate("/")}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-primary-600 mb-2">Edit Artifact</h1>
        <p className="text-neutral-600 mb-6">
          Update artifact information, upload images, or add a 3D model
        </p>

        {submissionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {submissionError}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="model">3D Model</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-medium text-primary-500">Basic Information</h2>
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Artifact Title*</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Bronze Age Axe Head" 
                              value={field.value as string}
                              onChange={field.onChange} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="id_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catalog ID Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., ART-2023-0001" 
                              value={field.value as string}
                              onChange={field.onChange} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description*</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed description of the artifact" 
                              className="min-h-[100px]" 
                              value={field.value as string}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Origin and Dating */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200">
                    <h2 className="text-xl font-medium text-primary-500">Origin and Dating</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="culture"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Culture*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Roman, Egyptian, Mayan" 
                                value={field.value as string}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date_start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year Created (BCE/CE)*</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., -500 for 500 BCE, 1200 for 1200 CE" 
                                value={field.value === undefined ? '' : field.value}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Period</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Neolithic, Bronze Age, Medieval" 
                                value={field.value as string}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="provenance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location/Provenance</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Pompeii, Italy" 
                                value={field.value as string}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Physical Characteristics */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200">
                    <h2 className="text-xl font-medium text-primary-500">Physical Characteristics</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="materials"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Materials*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Bronze, Clay, Stone"
                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? value.split(',').map(m => m.trim()) : []);
                                }}
                              />
                            </FormControl>
                            <p className="text-xs text-neutral-500">Separate multiple materials with commas</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dimensions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dimensions</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., 15 x 10 x 5 cm" 
                                value={field.value as string}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="has_3d_model"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value === true}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="mt-1"
                            />
                          </FormControl>
                          <div>
                            <FormLabel>3D Model Available</FormLabel>
                            <p className="text-sm text-neutral-500">
                              Check this box if a 3D model is available for this artifact.
                              You can upload it in the 3D Model tab.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-neutral-200">
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto" 
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : "Update Artifact"}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="images">
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-primary-500">Artifact Images</h2>
                
                {/* Image Upload Section */}
                <div className="border border-dashed border-neutral-300 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <ImageIcon className="h-10 w-10 mx-auto text-neutral-400" />
                    <p className="mt-2 text-neutral-600">Upload images of the artifact</p>
                    <p className="text-sm text-neutral-500">Supported formats: JPG, PNG, GIF (max 5MB)</p>
                  </div>
                  
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadImage(file);
                      }
                      // Clear the input
                      e.target.value = '';
                    }}
                  />
                  
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select Image
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Image Gallery */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {images.map((image) => (
                      <div 
                        key={image.id} 
                        className={`relative rounded-lg overflow-hidden border ${image.is_primary ? 'ring-2 ring-primary' : ''}`}
                      >
                        <img 
                          src={image.url} 
                          alt={image.caption} 
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-2 bg-white">
                          <p className="text-sm truncate">{image.caption}</p>
                          {image.is_primary && (
                            <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full mt-1">
                              Primary Image
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-neutral-500">
                    <p>No images uploaded yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="model">
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-primary-500">3D Model</h2>
                
                {/* 3D Model Upload Section */}
                <div className="border border-dashed border-neutral-300 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <div className="h-10 w-10 mx-auto text-neutral-400">🧊</div>
                    <p className="mt-2 text-neutral-600">Upload a 3D model of the artifact</p>
                    <p className="text-sm text-neutral-500">Supported formats: OBJ, GLTF, GLB (max 15MB)</p>
                  </div>
                  
                  <Input
                    type="file"
                    accept=".obj,.gltf,.glb"
                    className="hidden"
                    id="model-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        upload3DModel(file);
                      }
                      // Clear the input
                      e.target.value = '';
                    }}
                  />
                  
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('model-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select 3D Model
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Model Preview */}
                {model3D ? (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Current 3D Model</h3>
                        <p className="text-sm bg-neutral-100 px-2 py-1 rounded uppercase">{model3D.type}</p>
                      </div>
                      <p className="text-sm text-neutral-600 mb-4">
                        A 3D model has been uploaded for this artifact. You can view it on the artifact's detail page.
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/artifacts/${artifactId}`)}
                        >
                          View Artifact
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            // Implement model removal functionality
                            // For now, we'll just show a toast
                            toast({
                              title: "Not implemented",
                              description: "Model removal functionality not yet implemented",
                              variant: "default",
                            });
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-neutral-500">
                    <p>No 3D model uploaded yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}