"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { Trip } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { addTrip, getTrips, updateTrip, deleteTrip } from "@/services/tripService";
import { listenToTeamMembers } from "@/services/teamService";

export default function TripsPage() {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLogTripOpen, setIsLogTripOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);
  const [teamMembers, setTeamMembers] = React.useState<{ id: string; name: string; email: string }[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const getCurrentUserName = React.useCallback(() => {
    const currentMember = teamMembers.find(member => member.email === user?.email);
    return currentMember?.name || user?.email || "";
  }, [teamMembers, user]);

  // Load team members
  React.useEffect(() => {
    const unsubscribe = listenToTeamMembers((members) => {
      setTeamMembers(members.map(({ id, name, email }) => ({ id, name, email })));
    });
    return () => unsubscribe();
  }, []);

  // Load trips
  React.useEffect(() => {
    const loadTrips = async () => {
      try {
        const data = await getTrips();
        setTrips(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Could not load trips: " + error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadTrips();
  }, [toast]);

  const handleLogTripSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newTrip = {
      startLocation: formData.get("startLocation") as string,
      destination: formData.get("destination") as string,
      distance: parseFloat(formData.get("distance") as string),
      teamMember: getCurrentUserName(), // Use the function to get the current user's name
      date: new Date().toISOString(),
    };

    try {
      await addTrip(newTrip);
      setIsLogTripOpen(false);
      toast({ title: "Trip logged", description: "Your trip has been logged successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not log trip: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTrip) return;

    const formData = new FormData(event.currentTarget);
    const updatedTrip: Trip = {
      ...selectedTrip,
      startLocation: formData.get("startLocation") as string,
      destination: formData.get("destination") as string,
      distance: parseFloat(formData.get("distance") as string),
      teamMember: getCurrentUserName(), // Use the function to get the current user's name
    };

    try {
      await updateTrip(updatedTrip);
      setIsEditOpen(false);
      toast({ title: "Success", description: "Trip updated successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not update trip: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;

    try {
      await deleteTrip(selectedTrip.id);
      setIsDeleteAlertOpen(false);
      toast({ title: "Success", description: "Trip deleted successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not delete trip: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resor</h1>
          <p className="text-muted-foreground">
            Logga resor och distans för milersättning!
          </p>
        </div>
        <Dialog open={isLogTripOpen} onOpenChange={setIsLogTripOpen}>
          <Button disabled={isLoading} onClick={() => setIsLogTripOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Logga Resa
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Logga Resa 🚗</DialogTitle>
              <DialogDescription>
                Fyll i detaljerna för din resa.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogTripSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startLocation" className="text-right">
                    Start
                  </Label>
                  <Input
                    id="startLocation"
                    name="startLocation"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="destination" className="text-right">
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    name="destination"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="distance" className="text-right">
                    Distans (km)
                  </Label>
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    step="0.1"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teamMember" className="text-right">
                    Person
                  </Label>
                  <Input
                    id="teamMember"
                    name="teamMember"
                    defaultValue={teamMembers.find(member => member.email === user?.email)?.name || user?.email || ""}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Distans (km)</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No trips found.
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{trip.startLocation}</TableCell>
                      <TableCell>{trip.destination}</TableCell>
                      <TableCell>{trip.distance}</TableCell>
                      <TableCell>{trip.teamMember}</TableCell>
                      <TableCell>
                        {format(new Date(trip.date), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTrip(trip);
                                setIsEditOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => {
                                setSelectedTrip(trip);
                                setIsDeleteAlertOpen(true);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden">
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : trips.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No trips found.
                </div>
              ) : (
                trips.map((trip) => (
                  <Card key={trip.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {trip.startLocation} → {trip.destination}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {trip.distance} km • {trip.teamMember}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(trip.date), "yyyy-MM-dd")}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTrip(trip);
                                setIsEditOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => {
                                setSelectedTrip(trip);
                                setIsDeleteAlertOpen(true);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Make changes to the trip entry.
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startLocation" className="text-right">
                    Start
                  </Label>
                  <Input
                    id="startLocation"
                    name="startLocation"
                    defaultValue={selectedTrip.startLocation}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="destination" className="text-right">
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    name="destination"
                    defaultValue={selectedTrip.destination}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="distance" className="text-right">
                    Distans (km)
                  </Label>
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    step="0.1"
                    defaultValue={selectedTrip.distance}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teamMember" className="text-right">
                    Person
                  </Label>
                  <Input
                    id="teamMember"
                    name="teamMember"
                    defaultValue={selectedTrip.teamMember}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected trip entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}