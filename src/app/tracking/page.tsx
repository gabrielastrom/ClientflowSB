"use client";
export const dynamic = "force-dynamic";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TimeEntry, TeamMember, Client } from "@/lib/types";
import { PlusCircle, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { listenToTeamMembers } from "@/services/teamService";
import { getTimeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry } from "@/services/timeTrackingService";
import { Skeleton } from "@/components/ui/skeleton";
import { getClients } from "@/services/clientService";

type SortableTimeEntryKeys = keyof TimeEntry;

type MonthlySummary = {
  teamMember: string;
  totalHours: number;
};

export default function TrackingPage() {
  const [timeEntries, setTimeEntries] = React.useState<TimeEntry[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isLogTimeOpen, setIsLogTimeOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<TimeEntry | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

  const [defaultDate, setDefaultDate] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableTimeEntryKeys; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [monthlySummary, setMonthlySummary] = React.useState<MonthlySummary[]>([]);


  const { toast } = useToast();

  React.useEffect(() => {
    // Set the default date and month on the client to avoid hydration mismatch
    const now = new Date();
    setDefaultDate(now.toISOString().split("T")[0]);
    setSelectedMonth(now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2));

    async function fetchData() {
      setIsLoading(true);
      try {
        const [entriesData, clientData] = await Promise.all([
          getTimeEntries(),
          getClients(),
        ]);
        setTimeEntries(entriesData);
        setClients(clientData);

        if (entriesData.length > 0) {
            const latestDate = entriesData[0].date;
            setSelectedMonth(latestDate.substring(0, 7));
        }

      } catch (error) {
        toast({
          title: "Error fetching data",
          description: "Could not load data from the database.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

    const unsubscribeTeam = listenToTeamMembers(setTeamMembers);
    return () => unsubscribeTeam();

  }, [toast]);

  React.useEffect(() => {
    if (!selectedMonth) return;

    const summary: Record<string, number> = {};

    timeEntries
      .filter(entry => entry.date.startsWith(selectedMonth))
      .forEach(entry => {
        if (!summary[entry.teamMember]) {
          summary[entry.teamMember] = 0;
        }
        summary[entry.teamMember] += entry.duration;
      });
    
    const summaryArray = Object.entries(summary)
        .map(([teamMember, totalHours]) => ({ teamMember, totalHours }))
        .sort((a,b) => b.totalHours - a.totalHours);

    setMonthlySummary(summaryArray);
  }, [selectedMonth, timeEntries]);

  const sortedTimeEntries = React.useMemo(() => {
    let sortableItems = [...timeEntries];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [timeEntries, sortConfig]);

  const requestSort = (key: SortableTimeEntryKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortableTimeEntryKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleLogTimeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newEntryData: Omit<TimeEntry, 'id'> = {
      date: formData.get("date") as string,
      teamMember: formData.get("teamMember") as string,
      client: formData.get("client") as string,
      task: formData.get("task") as string,
      duration: parseFloat(formData.get("duration") as string),
    };

    try {
        const newEntry = await addTimeEntry(newEntryData);
        setTimeEntries([newEntry, ...timeEntries]);
        setIsLogTimeOpen(false);
        (event.target as HTMLFormElement).reset();
        toast({
          title: "Time Logged",
          description: "Your time entry has been successfully saved.",
        });
    } catch(error) {
        toast({ title: "Error", description: "Could not save time entry.", variant: "destructive" });
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEntry) return;

    const formData = new FormData(event.currentTarget);
    const updatedEntry: TimeEntry = {
      ...selectedEntry,
      date: formData.get("date") as string,
      teamMember: formData.get("teamMember") as string,
      client: formData.get("client") as string,
      task: formData.get("task") as string,
      duration: parseFloat(formData.get("duration") as string),
    };

    try {
        await updateTimeEntry(updatedEntry);
        setTimeEntries(
          timeEntries.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
        );
        setIsEditOpen(false);
        toast({
          title: "Entry Updated",
          description: "The time entry has been successfully updated.",
        });
    } catch (error) {
        toast({ title: "Error", description: "Could not update time entry.", variant: "destructive" });
    }
  };
  
  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    try {
        await deleteTimeEntry(selectedEntry.id);
        setTimeEntries(timeEntries.filter((e) => e.id !== selectedEntry.id));
        setIsDeleteAlertOpen(false);
        toast({
            title: "Entry Deleted",
            description: "The time entry has been removed.",
        });
    } catch (error) {
        toast({ title: "Error", description: "Could not delete time entry.", variant: "destructive" });
    }
  };


  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
            <p className="text-muted-foreground">
              Log and review time spent on clients and tasks.
            </p>
          </div>
          <Dialog open={isLogTimeOpen} onOpenChange={setIsLogTimeOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Log Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log New Time Entry</DialogTitle>
                <DialogDescription>
                  Fill in the details for your time log.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLogTimeSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date
                    </Label>
                    <Input id="date" name="date" type="date" defaultValue={defaultDate} key={defaultDate} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="teamMember" className="text-right">
                      Team Member
                    </Label>
                    <Select name="teamMember">
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="client" className="text-right">
                      Client
                    </Label>
                    <Select name="client">
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="task" className="text-right">
                      Task
                    </Label>
                    <Input id="task" name="task" placeholder="e.g., Weekly Sync" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">
                      Hours
                    </Label>
                    <Input id="duration" name="duration" type="number" step="0.01" placeholder="e.g., 1.5" className="col-span-3" required />
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

        {/* Time Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              A log of all time tracked by the team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('date')}>
                        Date
                        {getSortIcon('date')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('teamMember')}>
                        Team Member
                        {getSortIcon('teamMember')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('client')}>
                        Client
                        {getSortIcon('client')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('task')}>
                        Task
                        {getSortIcon('task')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => requestSort('duration')} className="justify-end w-full">
                        Hours
                        {getSortIcon('duration')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : sortedTimeEntries.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                              No time entries found.
                          </TableCell>
                      </TableRow>
                  ) : (
                    sortedTimeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell className="font-medium">{entry.teamMember}</TableCell>
                        <TableCell>{entry.client}</TableCell>
                        <TableCell>{entry.task}</TableCell>
                        <TableCell className="text-right">{entry.duration.toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedEntry(entry);
                                  setIsEditOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onSelect={() => {
                                  setSelectedEntry(entry);
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
                        <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                    ))
                ) : sortedTimeEntries.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 rounded-lg border-2 border-dashed">
                        <p>No time entries found.</p>
                    </div>
                ) : (
                    sortedTimeEntries.map((entry) => (
                    <Card key={entry.id}>
                        <CardContent className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{entry.task}</p>
                                <p className="text-sm text-muted-foreground">{entry.client}</p>
                            </div>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => { setSelectedEntry(entry); setIsEditOpen(true); }}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onSelect={() => { setSelectedEntry(entry); setIsDeleteAlertOpen(true); }}
                                >
                                Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>{entry.teamMember}</span>
                            <span>{entry.date}</span>
                        </div>
                        <div className="flex justify-end items-center font-bold text-lg">
                            <span>{entry.duration.toFixed(2)}h</span>
                        </div>
                        </CardContent>
                    </Card>
                    ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Edit Time Entry Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Entry</DialogTitle>
              <DialogDescription>
                Make changes to the time entry. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {selectedEntry && (
              <form onSubmit={handleEditSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-date" className="text-right">Date</Label>
                    <Input id="edit-date" name="date" type="date" defaultValue={selectedEntry.date} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-teamMember" className="text-right">Team Member</Label>
                    <Select name="teamMember" defaultValue={selectedEntry.teamMember}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-client" className="text-right">Client</Label>
                    <Select name="client" defaultValue={selectedEntry.client}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-task" className="text-right">Task</Label>
                    <Input id="edit-task" name="task" defaultValue={selectedEntry.task} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-duration" className="text-right">Hours</Label>
                    <Input id="edit-duration" name="duration" type="number" step="0.01" defaultValue={selectedEntry.duration} className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Delete Entry Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this time entry.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteEntry}
                >
                Continue
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Monthly Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>
              Total hours logged by each team member for the selected month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Label htmlFor="month-select" className="shrink-0">Select Month</Label>
              <Input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-48"
                disabled={isLoading}
              />
            </div>
            {monthlySummary.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {monthlySummary.map(item => (
                  <div key={item.teamMember} className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{item.teamMember}</p>
                    <p className="font-bold text-lg">{item.totalHours.toFixed(2)}h</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 rounded-lg border-2 border-dashed">
                <p>No time entries found for the selected month.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
