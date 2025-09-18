"use client";

import { useEffect, useState } from 'react';
import { Gear, TeamMember } from '@/lib/types';
import { getGear, addGear, updateGear, deleteGear } from '@/services/gearService';
import { listenToTeamMembers } from '@/services/teamService';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export default function GearPage() {
  const [gear, setGear] = useState<Gear[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGear, setSelectedGear] = useState<Gear | null>(null);
  const [newGear, setNewGear] = useState<{
    name: string;
    status: Gear['status'];
    assignedTo: string | null;
  }>({
    name: '',
    status: 'available',
    assignedTo: null
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGear();
    const unsubscribe = listenToTeamMembers((members) => {
      setTeamMembers(members);
    });
    return () => unsubscribe();
  }, []);

  async function loadGear() {
    try {
      const data = await getGear();
      setGear(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load gear',
        variant: 'destructive',
      });
    }
  }

  async function handleAddGear() {
    if (!newGear.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a gear name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addGear({
        name: newGear.name,
        assignedTo: newGear.assignedTo,
        status: newGear.status,
      });
      setNewGear({
        name: '',
        status: 'available',
        assignedTo: null
      });
      setIsAddDialogOpen(false);
      await loadGear();
      toast({
        title: 'Success',
        description: 'Gear added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add gear',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleStatusClick(gear: Gear) {
    setSelectedGear(gear);
    setIsEditDialogOpen(true);
  }

  async function handleDeleteGear(id: string) {
    try {
      await deleteGear(id);
      await loadGear();
      toast({
        title: 'Success',
        description: 'Gear deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete gear',
        variant: 'destructive',
      });
    }
  }

  function handleEditClick(gear: Gear) {
    setSelectedGear(gear);
    setIsEditDialogOpen(true);
  }

  async function handleEditGear() {
    if (!selectedGear) return;

    setIsLoading(true);
    try {
      await updateGear(selectedGear);
      setIsEditDialogOpen(false);
      setSelectedGear(null);
      await loadGear();
      toast({
        title: 'Success',
        description: 'Gear updated successfully',
      });
    } catch (error) {
      console.error('Update gear error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update gear',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderContent = () => (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gear 📸</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Gear</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Gear</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter gear name"
                  value={newGear.name}
                  onChange={(e) => setNewGear(prev => ({ ...prev, name: e.target.value }))}
                />
                <Select
                  value={newGear.status}
                  onValueChange={(value) => setNewGear(prev => ({ ...prev, status: value as Gear['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="coming_soon">Coming soon...!</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newGear.assignedTo || 'none'}
                  onValueChange={(value) => setNewGear(prev => ({ 
                    ...prev, 
                    assignedTo: value === 'none' ? null : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Assigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddGear}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gear.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'available'
                          ? 'secondary'
                          : item.status === 'in_use'
                          ? 'default'
                          : item.status === 'coming_soon'
                          ? 'outline'
                          : 'destructive'
                      }
                      className="capitalize"
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.assignedTo 
                      ? teamMembers.find(member => member.id === item.assignedTo)?.name.toUpperCase() || 'Unknown User'
                      : 'Not Assigned'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditClick(item)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gear</DialogTitle>
          </DialogHeader>
          {selectedGear && (
            <div className="space-y-4">
              <Input
                placeholder="Enter gear name"
                value={selectedGear.name}
                onChange={(e) => setSelectedGear(prev => prev ? { ...prev, name: e.target.value } : prev)}
              />
              <Select
                value={selectedGear.status}
                onValueChange={(value) => setSelectedGear(prev => prev ? { ...prev, status: value as Gear['status'] } : prev)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="coming_soon">Coming soon...!</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedGear.assignedTo || 'none'}
                onValueChange={(value) => setSelectedGear(prev => prev ? {
                  ...prev,
                  assignedTo: value === 'none' ? null : value,
                  status: value === 'none' ? 'available' : 'in_use'
                } : prev)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Assigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleEditGear}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Separator />
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedGear) {
                      handleDeleteGear(selectedGear.id);
                      setIsEditDialogOpen(false);
                      setSelectedGear(null);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  Delete Gear
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <AppShell>
      {renderContent()}
    </AppShell>
  );
}