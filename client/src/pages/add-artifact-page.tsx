import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertCircle } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { insertArtifactSchema } from "@shared/schema";

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

export default function AddArtifactPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

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

  // Handle API submission
  const mutation = useMutation({
    mutationFn: async (values: ArtifactFormValues) => {
      const response = await apiRequest("POST", "/api/artifacts", values);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries and redirect
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
      navigate("/");
    },
    onError: (error: Error) => {
      setSubmissionError(error.message);
    },
  });

  // Handle form submission
  function onSubmit(values: ArtifactFormValues) {
    setSubmissionError(null);
    mutation.mutate(values);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-primary-600 mb-2">Add New Artifact</h1>
        <p className="text-neutral-600 mb-6">
          Use this form to add a new artifact to the collection
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
                          You'll be able to upload it after creating the artifact.
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
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Add Artifact"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}