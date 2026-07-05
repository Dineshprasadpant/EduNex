"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { deleteUploadedFile, uploadFile } from "../../../apiCalls/fileUpload";

interface EventModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedEvent: any) => void;
  onDelete: () => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  isLoading: boolean;
}

export default function EventModal({
  event,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  isEditing,
  setIsEditing,
  isLoading,
}: EventModalProps) {
  const [editedEvent, setEditedEvent] = useState(event);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedEvent((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleOrganizerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEvent((prev: any) => ({
      ...prev,
      organizer: { ...prev.organizer, [name]: value },
    }));
  };

  const handleVenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEvent((prev: any) => ({
      ...prev,
      venue: { ...prev.venue, [name]: value },
    }));
  };

  const handleResourceMaterialChange = (index: number, field: string, value: string | number) => {
    setEditedEvent((prev: any) => {
      const updated = [...prev.resourceMaterials];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, resourceMaterials: updated };
    });
  };

  const handleExtraInfoChange = (index: number, field: string, value: string) => {
    setEditedEvent((prev: any) => {
      const updated = [...prev.extraInformation];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, extraInformation: updated };
    });
  };

  const addResourceMaterial = () => {
    setEditedEvent((prev: any) => ({
      ...prev,
      resourceMaterials: [
        ...prev.resourceMaterials,
        { materialName: "", fileType: "", fileSize: 0, url: "" },
      ],
    }));
  };

  const addExtraInformation = () => {
    setEditedEvent((prev: any) => ({
      ...prev,
      extraInformation: [...prev.extraInformation, { title: "", description: "" }],
    }));
  };

  const removeResourceMaterial = async (index: number) => {
    const materialToRemove = editedEvent.resourceMaterials[index];
    
    try {
      // Delete the file from AWS if it exists
      if (materialToRemove.url) {
        await deleteUploadedFile(materialToRemove.url);
      }
      
      // Remove from state
      setEditedEvent((prev: any) => ({
        ...prev,
        resourceMaterials: prev.resourceMaterials.filter((_: any, i: number) => i !== index),
      }));
    } catch (error) {
      console.error("Failed to delete file from AWS:", error);
    }
  };

  const removeExtraInformation = (index: number) => {
    setEditedEvent((prev: any) => ({
      ...prev,
      extraInformation: prev.extraInformation.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleImageRemove = async () => {
    if (!editedEvent.image) return;

    try {
      // Delete the image from AWS
      await deleteUploadedFile(editedEvent.image);
      // Remove the image from the event
      setEditedEvent((prev: any) => ({ ...prev, image: "" }));
    } catch (error) {
      console.error("Failed to delete image from AWS:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // First delete the existing image if it exists
      if (editedEvent.image) {
        await deleteUploadedFile(editedEvent.image);
      }

      // Upload the new image
      const result = await uploadFile(file);
      
      // Update the event with the new image URL
      setEditedEvent((prev: any) => ({
        ...prev,
        image: result.data.url
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const triggerImageInput = () => {
    imageInputRef.current?.click();
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(index);
    try {
      // First delete the existing file if it exists
      const currentFile = editedEvent.resourceMaterials[index]?.url;
      if (currentFile) {
        await deleteUploadedFile(currentFile);
      }

      // Upload the new file
      const result = await uploadFile(file);

      setEditedEvent((prev: any) => {
        const updated = [...prev.resourceMaterials];
        updated[index] = {
          ...updated[index],
          url: result.data.url,
          fileType: result.data.format,
          fileSize: Math.round(result.data.size / 1024),
          materialName: result.data.original_filename
        };
        return { ...prev, resourceMaterials: updated };
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = '';
      }
    }
  };

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(editedEvent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? "Edit Event" : "Event Details"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={editedEvent.title}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <Input
                    id="event_type"
                    name="event_type"
                    value={editedEvent.event_type}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={editedEvent.description}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
              {isEditing && (
                <div className="mt-4">
                  <Label>Event Image</Label>
                  {editedEvent.image ? (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="relative">
                        <img 
                          src={editedEvent.image} 
                          alt="Event" 
                          className="h-20 w-20 object-cover rounded"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={triggerImageInput}
                        >
                          Replace Image
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleImageRemove}
                        >
                          Remove Image
                        </Button>
                      </div>
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerImageInput}
                      >
                        Upload Image
                      </Button>
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rest of your form remains the same */}
            {/* Date & Time */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                Date & Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <div className="p-2 border rounded">
                    {format(parseISO(editedEvent.start_date), 'PPPp')}
                  </div>
                </div>
                <div>
                  <Label>End Date</Label>
                  <div className="p-2 border rounded">
                    {format(parseISO(editedEvent.end_date), 'PPPp')}
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                Organizer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="organizer.name">Name</Label>
                  <Input
                    id="organizer.name"
                    name="name"
                    value={editedEvent.organizer.name}
                    onChange={handleOrganizerChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="organizer.email">Email</Label>
                  <Input
                    id="organizer.email"
                    name="email"
                    type="email"
                    value={editedEvent.organizer.email}
                    onChange={handleOrganizerChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="organizer.phone">Phone</Label>
                  <Input
                    id="organizer.phone"
                    name="phone"
                    value={editedEvent.organizer.phone}
                    onChange={handleOrganizerChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Venue Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                Venue Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="venue.name">Venue Name</Label>
                  <Input
                    id="venue.name"
                    name="name"
                    value={editedEvent.venue.name}
                    onChange={handleVenueChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="venue.address">Address</Label>
                  <Input
                    id="venue.address"
                    name="address"
                    value={editedEvent.venue.address}
                    onChange={handleVenueChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Resource Materials */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Resource Materials
                </h3>
                {isEditing && (
                  <Button
                    type="button"
                    onClick={addResourceMaterial}
                    variant="outline"
                    size="sm"
                  >
                    + Add Material
                  </Button>
                )}
              </div>
              {editedEvent.resourceMaterials.map((material: any, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded bg-gray-50 relative">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeResourceMaterial(index)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    >
                      &times;
                    </button>
                  )}
                  <div>
                    <Label>Material Name</Label>
                    <Input
                      value={material.materialName}
                      onChange={(e) => handleResourceMaterialChange(index, "materialName", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>File Type</Label>
                    <Input
                      value={material.fileType}
                      onChange={(e) => handleResourceMaterialChange(index, "fileType", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>File Size (KB)</Label>
                    <Input
                      type="number"
                      value={material.fileSize}
                      onChange={(e) => handleResourceMaterialChange(index, "fileSize", Number(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={material.url}
                      onChange={(e) => handleResourceMaterialChange(index, "url", e.target.value)}
                      disabled={!isEditing}
                    />
                    {isEditing && (
                      <>
                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[index] = el;
                          }}
                          onChange={(e) => handleFileUpload(index, e)}
                          className="hidden"
                          accept="*/*"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => triggerFileInput(index)}
                          disabled={uploading === index}
                        >
                          {uploading === index ? "Uploading..." : "Upload File"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Extra Information */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Additional Information
                </h3>
                {isEditing && (
                  <Button
                    type="button"
                    onClick={addExtraInformation}
                    variant="outline"
                    size="sm"
                  >
                    + Add Info
                  </Button>
                )}
              </div>
              {editedEvent.extraInformation.map((info: any, index: number) => (
                <div key={index} className="mb-4 p-4 border rounded bg-gray-50 relative">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeExtraInformation(index)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    >
                      &times;
                    </button>
                  )}
                  <div className="mb-2">
                    <Label>Title</Label>
                    <Input
                      value={info.title}
                      onChange={(e) => handleExtraInfoChange(index, "title", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={info.description}
                      onChange={(e) => handleExtraInfoChange(index, "description", e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    Edit Event
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                    disabled={isLoading}
                  >
                    Delete Event
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedEvent(event);
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}