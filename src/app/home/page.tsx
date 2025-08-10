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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

import { appointments as allAppointments } from "@/lib/data";
import { type Content, type TimeEntry, type Appointment, type TeamMember, type Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, isSameDay } from 'date-fns';
import { PlusCircle, Clock, DollarSign } from 'lucide-react';
import { useAuth } from "@/contexts/auth-context";
import { listenToTeamMembers, updateTeamMember } from "@/services/teamService";
import { getContent, addContent, updateContent } from "@/services/contentService";
import { getTimeEntries, addTimeEntry } from "@/services/timeTrackingService";
import { getClients } from "@/services/clientService";


export default function HomePage() {
  const { user } = useAuth();
  
  const [content, setContent] = React.useState<Content[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [timeEntries, setTimeEntries] = React.useState<TimeEntry[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  
  const [weeklyTasks, setWeeklyTasks] = React.useState<Content[]>([]);
  const [monthlyTasks, setMonthlyTasks] = React.useState<Content[]>([]);
  // Period state for week/month select
  const [period, setPeriod] = React.useState<'week' | 'month'>('month');
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [monthlyProgress, setMonthlyProgress] = React.useState(0);
  const [completedCount, setCompletedCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLogTimeOpen, setIsLogTimeOpen] = React.useState<boolean>(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState<boolean>(false);
  const [defaultDate, setDefaultDate] = React.useState("");
  const [monthlyHours, setMonthlyHours] = React.useState(0);
  const [monthlySalary, setMonthlySalary] = React.useState(0);
  const [weeklyAppointments, setWeeklyAppointments] = React.useState<Appointment[]>([]);
  const [weekDates, setWeekDates] = React.useState<Date[]>([]);
  const [notes, setNotes] = React.useState("");

  const [selectedTask, setSelectedTask] = React.useState<Content | null>(null);
  const [isTaskStatusModalOpen, setIsTaskStatusModalOpen] = React.useState(false);
  const [currentUserData, setCurrentUserData] = React.useState<TeamMember | null>(null);

  const { toast } = useToast();

   React.useEffect(() => {
    async function fetchData() {
        try {
            const [contentData, timeEntriesData, clientData] = await Promise.all([
                getContent(),
                getTimeEntries(),
                getClients(),
            ]);
            setContent(contentData);
            setTimeEntries(timeEntriesData);
            setClients(clientData);
        } catch (error) {
            toast({
                title: "Error fetching data",
                description: "Could not load data from the database.",
                variant: "destructive"
            });
        }
    }
    fetchData();

    const unsubscribeTeam = listenToTeamMembers(setTeamMembers);

    return () => {
        unsubscribeTeam();
    }
  }, [toast]);
  
  React.useEffect(() => {
    if (!user || teamMembers.length === 0) return;

    // Try to match by id (preferred), then fallback to email, then name (case-insensitive)
    let userData = teamMembers.find(m => m.id === user.id || m.id === user.uid);
    if (!userData && user.email) {
      userData = teamMembers.find(m => m.email?.toLowerCase() === user.email.toLowerCase());
    }
    if (!userData && user.user_metadata?.full_name) {
      userData = teamMembers.find(m => m.name?.toLowerCase() === user.user_metadata.full_name.toLowerCase());
    }
    if (!userData && user.user_metadata?.name) {
      userData = teamMembers.find(m => m.name?.toLowerCase() === user.user_metadata.name.toLowerCase());
    }
    setCurrentUserData(userData || null);
    if (userData) {
      setNotes(userData.notes || "");
    }
  }, [user, teamMembers]);


  React.useEffect(() => {
    // Use selected user or fallback to current user
    const userObj = selectedUserId
      ? teamMembers.find((m) => m.id === selectedUserId)
      : currentUserData;
    if (!userObj) return;

    setDefaultDate(new Date().toISOString().split("T")[0]);

    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);

    // Filter user tasks
    const userContent = content.filter(item => item.owner.toLowerCase() === userObj.name.toLowerCase());

    const weekTasks = userContent.filter(item => {
      const deadline = new Date(item.deadline);
      return isWithinInterval(deadline, { start: startOfThisWeek, end: endOfThisWeek });
    }).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    setWeeklyTasks(weekTasks);

    const monthTasks = userContent.filter(item => {
      const deadline = new Date(item.deadline);
      return isWithinInterval(deadline, { start: startOfThisMonth, end: endOfThisMonth });
    }).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    setMonthlyTasks(monthTasks);

    const assignedThisMonth = userContent.filter(item => {
        const deadline = new Date(item.deadline);
        return isWithinInterval(deadline, { start: startOfThisMonth, end: endOfThisMonth });
    });

    const completedThisMonth = assignedThisMonth.filter(item => item.status === 'Done');

    setCompletedCount(completedThisMonth.length);
    setTotalCount(assignedThisMonth.length);

    if (assignedThisMonth.length > 0) {
        setMonthlyProgress((completedThisMonth.length / assignedThisMonth.length) * 100);
    } else {
        setMonthlyProgress(0);
    }

    // Filter weekly appointments
    const filteredAppointments = allAppointments.filter(
      (appt) => isWithinInterval(new Date(appt.date), { start: startOfThisWeek, end: endOfThisWeek })
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setWeeklyAppointments(filteredAppointments);
    setWeekDates(eachDayOfInterval({ start: startOfThisWeek, end: endOfThisWeek }));

    // Calculate monthly time entries and salary
    let userTimeEntriesThisMonth: TimeEntry[] = [];
    let hourlyRate = 0;
    if (userObj) {
      userTimeEntriesThisMonth = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return (
          entry.teamMember?.trim().toLowerCase() === userObj.name?.trim().toLowerCase() &&
          isWithinInterval(entryDate, { start: startOfThisMonth, end: endOfThisMonth })
        );
      });
      hourlyRate = userObj.hourlyrate || 0;
    }
    const totalHours = userTimeEntriesThisMonth.reduce((sum, entry) => sum + entry.duration, 0);
    const salary = totalHours * hourlyRate;
    setMonthlyHours(totalHours);
    setMonthlySalary(salary);

  }, [timeEntries, content, currentUserData, selectedUserId, teamMembers]);


  // Manual save for notes
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);
  const [notesSaved, setNotesSaved] = React.useState(false);

  const handleNotesSave = async () => {
    if (!currentUserData || notes === (currentUserData.notes || '')) {
      return;
    }
    setIsSavingNotes(true);
    setNotesSaved(false);
    try {
      await updateTeamMember({ ...currentUserData, notes });
      setNotesSaved(true);
      toast({ title: "Notes saved", description: "Your notes have been updated." });
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast({ title: "Error", description: "Failed to save your notes.", variant: "destructive" });
    } finally {
      setIsSavingNotes(false);
    }
  };


  const getStatusBadgeClassName = (status: 'To Do' | 'In Progress' | 'In Review' | 'Done') => {
    switch (status) {
      case 'Done':
        return 'bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/20 hover:bg-blue-500/30';
                        <CardContent>
                            {/* Responsive layout: selects on one row, task list below, with good spacing */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                                    <Select
                                        value={period}
                                        onValueChange={val => setPeriod(val as 'week' | 'month')}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">Denna vecka</SelectItem>
                                            <SelectItem value="month">Denna månad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={selectedUserId || currentUserData?.id || ''}
                                        onValueChange={(val) => setSelectedUserId(val)}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamMembers.map((member) => (
                                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full">
                                    {period === "week" ? (
                                        <TaskList tasks={weeklyTasks} onTaskClick={handleTaskClick} />
                                    ) : (
                                        <TaskList tasks={monthlyTasks} onTaskClick={handleTaskClick} />
                                    )}
                                </div>
                            </div>
                        </CardContent>
    }
  };

  const handleLogTimeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUserData) return;
    const formData = new FormData(event.currentTarget);
    // Match tracking page: use team member id, map to name for DB
    const teamMemberId = formData.get("teamMember") as string;
    const teamMemberObj = teamMembers.find((m) => m.id === teamMemberId || m.name === teamMemberId);
    const newEntryData = {
      date: formData.get("date") as string,
      name: teamMemberObj ? teamMemberObj.name : teamMemberId, // DB expects 'name'
      client: formData.get("client") as string,
      task: formData.get("task") as string,
      duration: parseFloat(formData.get("duration") as string),
    };

    try {
      const newEntry = await addTimeEntry(newEntryData as any);
      setTimeEntries([
        {
          ...newEntry,
          teamMember: newEntry.teamMember || '',
        },
        ...timeEntries,
      ]);
      setIsLogTimeOpen(false);
      (event.target as HTMLFormElement).reset();
      toast({
        title: "Time Logged",
        description: "Your time entry has been successfully saved.",
      });
    } catch (error) {
      console.error('Error in handleLogTimeSubmit:', error);
      toast({
        title: "Error",
        description: "Could not save time entry.",
        variant: "destructive"
      });
    }
  };

  const handleAddTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUserData) return;
    const formData = new FormData(event.currentTarget);
    const newContentData: Omit<Content, "id"> = {
      title: formData.get("title") as string,
      client: formData.get("client") as string,
      status: "To Do",
      deadline: formData.get("deadline") as string,
      owner: currentUserData.name,
      description: formData.get("description") as string || undefined,
    };
    try {
        const newContent = await addContent(newContentData);
        setContent((prev) => [newContent, ...prev]);
        setIsAddTaskOpen(false);
        toast({ title: "Success", description: "Task added successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
    }
  };
  
  const handleTaskClick = (task: Content) => {
    setSelectedTask(task);
    setIsTaskStatusModalOpen(true);
  };

  const handleStatusUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTask) return;

    const formData = new FormData(event.currentTarget);
    const newStatus = formData.get("status") as Content["status"];

    const updatedTask = { ...selectedTask, status: newStatus };

    try {
        await updateContent(updatedTask);
        setContent(content.map(item => 
          item.id === selectedTask.id ? updatedTask : item
        ));
        setIsTaskStatusModalOpen(false);
        setSelectedTask(null);
    } catch (error) {
        toast({ title: "Error", description: "Could not update task status.", variant: "destructive" });
    }
  };

  const TaskList = ({ tasks, onTaskClick }: { tasks: Content[], onTaskClick: (task: Content) => void }) => {
    if (tasks.length === 0) {
      return <p className="text-muted-foreground text-center p-8">No tasks for this period. Great job!</p>;
    }
    return (
      <div className="space-y-4 w-full">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer w-full"
            onClick={() => onTaskClick(task)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{task.title}</p>
              <p className="text-sm text-muted-foreground truncate">{task.client} - Deadline: {format(new Date(task.deadline), 'MMM dd')}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <Badge variant={'outline'} className={cn(getStatusBadgeClassName(task.status))}>
                {task.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (!user) {
    return null;
  }
  
  const welcomeName = currentUserData?.name || user.email?.split('@')[0] || '';
  const capitalizedName = welcomeName.charAt(0).toUpperCase() + welcomeName.slice(1);

  // Fix: Always enable the buttons, but show a warning if currentUserData is not loaded
  const handleLogTimeClick = () => {
    if (!currentUserData) {
      alert('User data not loaded yet. Please wait a moment and try again.');
      return;
    }
    setIsLogTimeOpen(true);
  };
  const handleAddTaskClick = () => {
    if (!currentUserData) {
      alert('User data not loaded yet. Please wait a moment and try again.');
      return;
    }
    setIsAddTaskOpen(true);
  };

  return (
    <AppShell>
        <div className="flex flex-col gap-8 w-full mx-0 px-0 max-w-none">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:items-center sm:text-left sm:items-center px-0 w-full max-w-none">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Välkommen, {capitalizedName}!</h1>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleLogTimeClick} variant="secondary">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Logga tid
                    </Button>
                    <Button onClick={handleAddTaskClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ny Task
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mina Tasks</CardTitle>
                            <CardDescription>Tasks med deadlines denna vecka/månad.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Responsive: selects above task list on large screens, stacked on small */}
                            <div className="flex flex-col gap-6">
                              <Progress value={monthlyProgress} className="w-full" />
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full mb-2">
                                    <Select
                                        value={period}
                                        onValueChange={val => setPeriod(val as 'week' | 'month')}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">Denna vecka</SelectItem>
                                            <SelectItem value="month">Denna månad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={selectedUserId || currentUserData?.id || ''}
                                        onValueChange={(val) => setSelectedUserId(val)}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamMembers.map((member) => (
                                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full">
                                    {period === "week" ? (
                                        <TaskList tasks={weeklyTasks} onTaskClick={handleTaskClick} />
                                    ) : (
                                        <TaskList tasks={monthlyTasks} onTaskClick={handleTaskClick} />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Weekly Agenda</CardTitle>
                            <CardDescription>What's going on at BrandGuys this week!</CardDescription>
                        </CardHeader>
                        <CardContent className="pr-0">
                            <ScrollArea className="h-[290px]">
                              <div className="space-y-6 pr-6">
                                {weekDates.map((day) => {
                                  const dayAppointments = weeklyAppointments.filter((appt) =>
                                    isSameDay(new Date(appt.date), day)
                                  );

                                  if (dayAppointments.length === 0) {
                                    return null;
                                  }

                                  return (
                                    <div key={day.toString()}>
                                      <h3 className="font-semibold text-sm mb-3 sticky top-0 bg-card py-2 z-10">
                                        {format(day, 'EEEE, MMM d')}
                                      </h3>
                                      <div className="space-y-4">
                                        {dayAppointments.map((appt) => (
                                          <div key={appt.id} className="flex items-start gap-4 text-sm">
                                            <div className="flex flex-col items-center w-16 flex-shrink-0">
                                              <p className="font-semibold text-primary">{format(new Date(appt.date), 'HH:mm')}</p>
                                              <Badge
                                                variant={appt.type === "Deadline" ? "destructive" : "secondary"}
                                                className="mt-1"
                                              >
                                                {appt.type}
                                              </Badge>
                                            </div>
                                            <div className="border-l pl-4 flex-1">
                                              <p className="font-medium">{appt.title}</p>
                                              {appt.clientId && (
                                                <p className="text-xs text-muted-foreground">
                                                    {clients.find(c => c.id === appt.clientId)?.name}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                                {weeklyAppointments.length === 0 && (
                                  <div className="flex h-full min-h-[290px] items-center justify-center text-muted-foreground">
                                      <p>No appointments for this week.</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                        </CardContent>
                    </Card> */}
                </div>

                <div className="space-y-6">
                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Månadens Progress</CardTitle>
                            <CardDescription>Dina avklarade tasks den här månaden.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                <span className="text-sm font-bold">{completedCount}/{totalCount}</span>
                            </div>
                            <Progress value={monthlyProgress} className="w-full" />
                        </CardContent>
                    </Card> */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Timmar & Bruttolön</CardTitle>
                            <CardDescription>Månadens loggade timmar och bruttolön.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-5 w-5" />
                                    <span>Timmar Loggade</span>
                                </div>
                                <span className="font-bold text-lg">{monthlyHours.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <DollarSign className="h-5 w-5" />
                                    <span>Beräknad Bruttolön</span>
                                </div>
                                <span className="font-bold text-lg">{monthlySalary.toLocaleString()} kr</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Snabblänkar</CardTitle>
                            {/* <CardDescription>Genvägar till några viktiga verktyg!</CardDescription> */}
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4">
                            <Button asChild>
                                <Link href="#">
                                    Email
                                </Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="https://discord.com/">
                                    Discord
                                </Link>
                            </Button>
                             <Button asChild variant="secondary">
                                <Link href="https://www.lucidlink.com/">
                                    LucidLink
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                            <CardDescription>Your personal scratchpad for quick notes and reminders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                handleNotesSave();
                              }}
                              className="flex flex-col gap-2"
                            >
                              <Textarea 
                                  placeholder="Type your notes here..." 
                                  className="h-48 resize-none"
                                  value={notes}
                                  onChange={(e) => {
                                    setNotes(e.target.value);
                                    setNotesSaved(false);
                                  }}
                                  disabled={!currentUserData || isSavingNotes} 
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <Button type="submit" disabled={!currentUserData || isSavingNotes || notes === (currentUserData?.notes || '')}>
                                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                                </Button>
                                {notesSaved && <span className="text-green-600 text-sm">Saved!</span>}
                              </div>
                            </form>
                        </CardContent>
                    </Card> */}
                </div>
            </div>
        </div>

        {/* Log Time Dialog */}
        <Dialog open={isLogTimeOpen} onOpenChange={setIsLogTimeOpen}>
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
                  <Input id="date" name="date" type="date" defaultValue={defaultDate} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teamMember" className="text-right">
                    Team Member
                  </Label>
                  <Select name="teamMember" defaultValue={currentUserData ? currentUserData.id : undefined}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
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
                    Task/Note
                  </Label>
                  <Textarea id="task" name="task" placeholder="e.g., Filming for Summer Campaign" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration" className="text-right">
                    Hours
                  </Label>
                  <Input id="duration" name="duration" type="number" step="0.1" placeholder="e.g., 1.5" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Log Time</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Task Dialog */}
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Fill in the details for your new task. It will be assigned to you.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTaskSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" name="title" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">Client</Label>
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
                  <Label htmlFor="deadline" className="text-right">Deadline</Label>
                  <Input id="deadline" name="deadline" type="date" defaultValue={defaultDate} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">Description</Label>
                  <Textarea id="description" name="description" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Add Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update Task Status Dialog */}
        <Dialog open={isTaskStatusModalOpen} onOpenChange={setIsTaskStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Task Status</DialogTitle>
              <DialogDescription>
                Update the status for the task: "{selectedTask?.title}".
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <form onSubmit={handleStatusUpdateSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select name="status" defaultValue={selectedTask.status}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
    </AppShell>
  );
}
