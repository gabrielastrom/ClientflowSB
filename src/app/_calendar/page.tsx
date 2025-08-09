"use client";
export const dynamic = "force-dynamic";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { appointments as allAppointments } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogHeaderDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Appointment, type Client, type TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format } from "date-fns";
import { getClients } from "@/services/clientService";
import { useAuth } from "@/contexts/auth-context";
import { listenToTeamMembers, updateTeamMember } from "@/services/teamService";


export default function CalendarPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = React.useState<Appointment[]>(allAppointments);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [weeklyAppointments, setWeeklyAppointments] = React.useState<Appointment[]>([]);
  const [weekDates, setWeekDates] = React.useState<Date[]>([]);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [currentUserData, setCurrentUserData] = React.useState<TeamMember | null>(null);
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [notes, setNotes] = React.useState("");
  const { toast } = useToast();
  const [defaultDate, setDefaultDate] = React.useState('');

  React.useEffect(() => {
    // Set date on client-side to avoid hydration mismatch
    setDate(new Date());
    setDefaultDate(new Date().toLocaleDateString('en-CA'));

    async function fetchClientsData() {
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not fetch clients.",
                variant: "destructive",
            });
        }
    }
    fetchClientsData();

     const unsubscribeTeam = listenToTeamMembers((teamData) => {
        setTeam(teamData);
    });

    return () => {
        unsubscribeTeam();
    };
  }, [toast]);
  
  React.useEffect(() => {
    if (user && team.length > 0) {
      const userData = team.find(m => m.id === user.uid) || null;
      setCurrentUserData(userData);
      if (userData) {
          setNotes(userData.notes || "");
      }
    }
  }, [user, team]);

  // Debounced effect for saving notes
  React.useEffect(() => {
    if (!currentUserData || notes === (currentUserData.notes || '')) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        await updateTeamMember({ ...currentUserData, notes });
      } catch (error) {
        console.error("Failed to save notes:", error);
        toast({ title: "Error", description: "Failed to save your notes.", variant: "destructive" });
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [notes, currentUserData, toast]);


  React.useEffect(() => {
    if (date) {
      const start = startOfWeek(date);
      const end = endOfWeek(date);
      const filteredAppointments = appointments.filter(
        (appt) => {
            const apptDate = new Date(appt.date);
            return apptDate >= start && apptDate <= end;
        }
      );
      setWeeklyAppointments(filteredAppointments);
      setWeekDates(eachDayOfInterval({ start, end }));
    } else {
        setWeeklyAppointments([]);
        setWeekDates([]);
    }
  }, [date, appointments]);

  const handleAddSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formDate = formData.get("date") as string;
    const formTime = formData.get("time") as string;
    const [year, month, day] = formDate.split('-').map(Number);
    const [hours, minutes] = formTime.split(':').map(Number);

    const newAppointment: Appointment = {
      id: `${Date.now()}`,
      title: formData.get("title") as string,
      date: new Date(year, month - 1, day, hours, minutes),
      type: formData.get("type") as Appointment["type"],
      clientId: formData.get("client") as string,
      location: formData.get("location") as string,
      assignedPersons: (formData.get("assignedPersons") as string).split(',').map(s => s.trim()).filter(Boolean),
      comments: formData.get("comments") as string,
    };
    
    setAppointments((prev) => [newAppointment, ...prev]);
    setIsAddOpen(false);
    toast({ title: "Success", description: "Appointment added successfully." });
  };
  
  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAppointment) return;

    const formData = new FormData(event.currentTarget);
    const formDate = formData.get("date") as string;
    const formTime = formData.get("time") as string;
    const [year, month, day] = formDate.split('-').map(Number);
    const [hours, minutes] = formTime.split(':').map(Number);

    const updatedAppointment: Appointment = {
      ...selectedAppointment,
      title: formData.get("title") as string,
      date: new Date(year, month - 1, day, hours, minutes),
      type: formData.get("type") as Appointment["type"],
      clientId: formData.get("client") as string,
      location: formData.get("location") as string,
      assignedPersons: (formData.get("assignedPersons") as string).split(',').map(s => s.trim()).filter(Boolean),
      comments: formData.get("comments") as string,
    };

    setAppointments(
      appointments.map((appt) => (appt.id === updatedAppointment.id ? updatedAppointment : appt))
    );
    setIsEditOpen(false);
    toast({ title: "Success", description: "Appointment updated successfully." });
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) return;
    setAppointments(appointments.filter((appt) => appt.id !== selectedAppointment.id));
    setIsDeleteAlertOpen(false);
    toast({
      title: "Appointment Deleted",
      description: `The appointment has been removed.`,
      variant: "destructive",
    });
  };

  const DayContentWithDot = React.useCallback(
    (props: { date: Date; activeModifiers: Record<string, boolean> }) => {
      const hasAppointment = appointments.some(
        (appt) => new Date(appt.date).toDateString() === props.date.toDateString()
      );
    
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          {props.date.getDate()}
          {hasAppointment && (
            <div
              className={cn(
                "absolute bottom-1.5 h-1.5 w-1.5 rounded-full",
                props.activeModifiers.selected
                  ? "bg-primary-foreground"
                  : "bg-primary"
              )}
            />
          )}
        </div>
      );
    },
    [appointments]
  );
  
  if (!date) {
    // Render nothing or a loading spinner on the server and initial client render
    return null; 
  }

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Manage your appointments and deadlines.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Appointment
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
                <CardTitle>Weekly Agenda</CardTitle>
                <CardDescription>Events and deadlines for the selected week.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[65vh] w-full">
                <div className="space-y-6 pr-4">
                  {weekDates.map((day) => {
                    const dayAppointments = weeklyAppointments
                      .filter((appt) => isSameDay(new Date(appt.date), day))
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    if (dayAppointments.length === 0) {
                      return null;
                    }

                    return (
                      <div key={day.toString()}>
                        <h3 className="font-semibold text-md mb-3 sticky top-0 bg-card py-2 z-10 border-b">{format(day, 'EEEE, MMM d')}</h3>
                        <div className="space-y-4">
                          {dayAppointments.map((appt) => (
                            <div
                              key={appt.id}
                              className="p-3 rounded-lg bg-muted/50 flex justify-between items-center cursor-pointer hover:bg-muted"
                              onClick={() => {
                                  setSelectedAppointment(appt);
                                  setIsViewOpen(true);
                              }}
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-20 text-center flex-shrink-0">
                                  <p className="font-semibold text-primary">{format(new Date(appt.date), 'HH:mm')}</p>
                                  <Badge
                                    variant={appt.type === "Deadline" ? "destructive" : "secondary"}
                                    className="mt-1"
                                  >
                                    {appt.type}
                                  </Badge>
                                </div>
                                <div className="border-l pl-4 flex-1 min-w-0">
                                  <p className="font-semibold whitespace-normal truncate">{appt.title}</p>
                                  <p className="text-sm text-muted-foreground">{clients.find(c => c.id === appt.clientId)?.name}</p>
                                </div>
                              </div>
                              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      aria-haspopup="true"
                                      size="icon"
                                      variant="ghost"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Toggle menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        setSelectedAppointment(appt);
                                        setIsEditOpen(true);
                                      }}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                      onSelect={() => {
                                        setSelectedAppointment(appt);
                                        setIsDeleteAlertOpen(true);
                                      }}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {weeklyAppointments.length === 0 && (
                    <div className="text-sm text-muted-foreground h-24 flex items-center justify-center rounded-lg border-2 border-dashed">
                      <p>No events scheduled for this week.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardContent className="p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="w-full"
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 p-4",
                            month: "space-y-4 flex-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex justify-around",
                            row: "flex w-full mt-2 justify-around",
                        }}
                        components={{
                          DayContent: DayContentWithDot,
                        }}
                    />
                </CardContent>
            </Card>
            {/* <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Your personal scratchpad for quick notes and reminders.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Textarea 
                    placeholder="Type your notes here..." 
                    className="h-48 resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!currentUserData} 
                />
              </CardContent>
            </Card> */}
        </div>
      </div>

       {/* Add Appointment Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Appointment</DialogTitle>
            <DialogHeaderDescription>Fill in the details for your new event.</DialogHeaderDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" placeholder="e.g. Strategy Meeting" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={defaultDate} className="col-span-3" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Time</Label>
                <Input id="time" name="time" type="time" defaultValue={"12:00"} className="col-span-3" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">Client</Label>
                <Select name="client">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select name="type" defaultValue="Meeting">
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Task">Task</SelectItem>
                      <SelectItem value="Deadline">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input id="location" name="location" placeholder="e.g. Online" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignedPersons" className="text-right">Assigned To</Label>
                <Input id="assignedPersons" name="assignedPersons" placeholder="Comma-separated names" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comments" className="text-right">Comments</Label>
                <Textarea id="comments" name="comments" placeholder="Add comments..." className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Appointment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogHeaderDescription>Make changes to the appointment.</DialogHeaderDescription>
          </DialogHeader>
          {selectedAppointment && (
            <form onSubmit={handleEditSubmit}>
               <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" name="title" defaultValue={selectedAppointment.title} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input id="date" name="date" type="date" defaultValue={new Date(selectedAppointment.date).toLocaleDateString('en-CA')} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">Time</Label>
                  <Input id="time" name="time" type="time" defaultValue={new Date(selectedAppointment.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">Client</Label>
                  <Select name="client" defaultValue={selectedAppointment.clientId}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <Select name="type" defaultValue={selectedAppointment.type}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Deadline">Deadline</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <Input id="location" name="location" defaultValue={selectedAppointment.location} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="assignedPersons" className="text-right">Assigned To</Label>
                  <Input id="assignedPersons" name="assignedPersons" defaultValue={selectedAppointment.assignedPersons?.join(', ')} className="col-span-3" placeholder="Comma-separated names" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comments" className="text-right">Comments</Label>
                  <Textarea id="comments" name="comments" defaultValue={selectedAppointment.comments} placeholder="Add comments..." className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Appointment Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAppointment?.title}</DialogTitle>
            <DialogHeaderDescription>
              {selectedAppointment?.type} on {selectedAppointment && new Date(selectedAppointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedAppointment && new Date(selectedAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </DialogHeaderDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4 text-sm">
              {selectedAppointment.clientId && (
                <div className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="col-span-2 font-medium">
                    {clients.find(c => c.id === selectedAppointment.clientId)?.name || 'N/A'}
                  </p>
                </div>
              )}
              {selectedAppointment.location && (
                <div className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="col-span-2 font-medium">
                    {selectedAppointment.location}
                  </p>
                </div>
              )}
              {selectedAppointment.assignedPersons && selectedAppointment.assignedPersons.length > 0 && (
                <div className="grid grid-cols-3 items-start gap-2">
                  <Label className="text-muted-foreground mt-1">Assigned</Label>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {selectedAppointment.assignedPersons.map(person => (
                      <Badge key={person} variant="secondary">{person}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedAppointment.comments && (
                <div className="grid grid-cols-3 items-start gap-2">
                  <Label htmlFor="comments-view" className="text-muted-foreground">Comments</Label>
                  <Textarea
                    id="comments-view"
                    readOnly
                    defaultValue={selectedAppointment.comments}
                    className="col-span-2"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete Appointment Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              appointment "{selectedAppointment?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAppointment}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppShell>
  );
}
