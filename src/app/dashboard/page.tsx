"use client";
export const dynamic = "force-dynamic";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { appointments as allAppointments, clients } from "@/lib/data";
import { type Appointment, type TeamMember, type TimeEntry, type Content, type Revenue, type Expense } from "@/lib/types";
import { Clock, DollarSign, Pencil } from "lucide-react";
import RevenueChart from "./financial-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import RevenueByClientChart from "./revenue-by-client-chart";
import { listenToTeamMembers, updateTeamMember } from "@/services/teamService";
import { getTimeEntries } from "@/services/timeTrackingService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getContent as fetchContent } from "@/services/contentService";
import { useAuth } from "@/contexts/auth-context";
import { listenToRevenues } from "@/services/revenueService";
import { listenToExpenses } from "@/services/expenseService";
import ExpenseByCategoryChart from "./expense-by-category-chart";
import ExpenseChart from "./expense-chart";


type TeamPerformanceData = {
  id: string;
  name: string;
  role: string;
  hoursThisMonth: number;
  photoURL?: string;
};

type MonthlyFinancialData = {
  month: string;
  amount: number;
};

type ExpenseByCategoryData = {
  name: string;
  expense: number;
  fill: string;
};

type RevenueByClientData = {
  name: string;
  revenue: number;
  fill: string;
};


export default function DashboardPage() {
  const { user } = useAuth();
  const [weeklyAppointments, setWeeklyAppointments] = React.useState<Appointment[]>([]);
  const [weekDates, setWeekDates] = React.useState<Date[]>([]);
  const [doneContentCount, setDoneContentCount] = React.useState(0);
  const [totalContentCount, setTotalContentCount] = React.useState(0);
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [timeEntries, setTimeEntries] = React.useState<TimeEntry[]>([]);
  const [teamPerformance, setTeamPerformance] = React.useState<TeamPerformanceData[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = React.useState(true);
  const [selectedMemberForRateEdit, setSelectedMemberForRateEdit] = React.useState<TeamMember | null>(null);
  const [isRateEditDialogOpen, setIsRateEditDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const [currentUserData, setCurrentUserData] = React.useState<TeamMember | null>(null);
  const [notes, setNotes] = React.useState("");
  const [monthlyRevenue, setMonthlyRevenue] = React.useState(0);
  const [revenueChange, setRevenueChange] = React.useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = React.useState(0);
  const [expenseChange, setExpenseChange] = React.useState(0);
  const [monthlyProfit, setMonthlyProfit] = React.useState(0);
  const [revenueTrend, setRevenueTrend] = React.useState<MonthlyFinancialData[]>([]);
  const [expenseTrend, setExpenseTrend] = React.useState<MonthlyFinancialData[]>([]);
  const [revenueByClient, setRevenueByClient] = React.useState<RevenueByClientData[]>([]);
  const [expenseByCategory, setExpenseByCategory] = React.useState<ExpenseByCategoryData[]>([]);


  React.useEffect(() => {
    const today = new Date();
    
    // Calculate weekly appointments
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const filteredAppointments = allAppointments.filter(
      (appt) => {
          const apptDate = new Date(appt.date);
          return apptDate >= start && apptDate <= end;
      }
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setWeeklyAppointments(filteredAppointments);
    setWeekDates(eachDayOfInterval({ start, end }));
    
    // Calculate content completion for the month
    async function calculateContentCompletion() {
        try {
            const allContent: Content[] = await fetchContent();
            const today = new Date();
            const startOfThisMonth = startOfMonth(today);
            const endOfThisMonth = endOfMonth(today);

            const contentThisMonth = allContent.filter(c => {
                const deadlineDate = new Date(c.deadline);
                return isWithinInterval(deadlineDate, { start: startOfThisMonth, end: endOfThisMonth });
            });
            
            const doneThisMonth = contentThisMonth.filter(c => c.status === 'Done').length;
            
            setDoneContentCount(doneThisMonth);
            setTotalContentCount(contentThisMonth.length);

        } catch (error) {
             toast({
                title: "Error",
                description: "Could not calculate content completion.",
                variant: "destructive"
            });
        }
    }
    calculateContentCompletion();


    // Fetch time entries
     getTimeEntries().then(setTimeEntries).catch(error => {
      console.error("Failed to fetch time entries for dashboard", error);
      toast({
          title: "Error",
          description: "Could not load time entry data.",
          variant: "destructive"
      });
    });

    // Set up real-time listener for team members
    const unsubscribeTeam = listenToTeamMembers((teamData) => {
        setTeam(teamData);
        if (teamData) setIsLoadingTeam(false);
    });

    const unsubscribeRevenues = listenToRevenues((allRevenues) => {
        const now = new Date();
        const currentMonthName = format(now, 'MMMM yyyy');
        const lastMonth = subMonths(now, 1);
        const lastMonthName = format(lastMonth, 'MMMM yyyy');

        const currentMonthTotal = allRevenues
            .filter(r => r.month === currentMonthName)
            .reduce((sum, r) => sum + r.revenue, 0);
        
        setMonthlyRevenue(currentMonthTotal);

        const lastMonthTotal = allRevenues
            .filter(r => r.month === lastMonthName)
            .reduce((sum, r) => sum + r.revenue, 0);

        if (lastMonthTotal > 0) {
            const change = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
            setRevenueChange(change);
        } else if (currentMonthTotal > 0) {
            setRevenueChange(100);
        } else {
            setRevenueChange(0);
        }

        // Calculate revenue trend for the last 7 months
        const trendData: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthName = format(date, 'MMMM yyyy');
            trendData[monthName] = 0;
        }

        allRevenues.forEach(r => {
            if (trendData.hasOwnProperty(r.month)) {
                trendData[r.month] += r.revenue;
            }
        });
        
        const sortedTrend = Array.from({length: 7}, (_, i) => {
            const date = subMonths(now, 6-i);
            const monthName = format(date, 'MMMM yyyy');
            const shortMonthName = format(date, 'MMM');
            return {
                month: shortMonthName,
                amount: trendData[monthName] || 0
            };
        })
        
        setRevenueTrend(sortedTrend);

        // Calculate revenue by client for the current month
        const revenueByClientData: Record<string, number> = {};
        allRevenues
            .filter(r => r.month === currentMonthName)
            .forEach(r => {
                if (!revenueByClientData[r.client]) {
                    revenueByClientData[r.client] = 0;
                }
                revenueByClientData[r.client] += r.revenue;
            });
        
        const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
        const clientChartData = Object.entries(revenueByClientData)
            .map(([clientName, totalRevenue], index) => ({
                name: clientName,
                revenue: totalRevenue,
                fill: chartColors[index % chartColors.length],
            }))
            .sort((a,b) => b.revenue - a.revenue);

        setRevenueByClient(clientChartData);

    });
    
    const unsubscribeExpenses = listenToExpenses((allExpenses) => {
        const now = new Date();
        const currentMonthName = format(now, 'MMMM yyyy');
        const lastMonth = subMonths(now, 1);
        const lastMonthName = format(lastMonth, 'MMMM yyyy');

        const currentMonthTotal = allExpenses
            .filter(e => e.month === currentMonthName)
            .reduce((sum, e) => sum + e.amount, 0);
        
        setMonthlyExpenses(currentMonthTotal);

        const lastMonthTotal = allExpenses
            .filter(e => e.month === lastMonthName)
            .reduce((sum, e) => sum + e.amount, 0);

        if (lastMonthTotal > 0) {
            const change = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
            setExpenseChange(change);
        } else if (currentMonthTotal > 0) {
            setExpenseChange(100);
        } else {
            setExpenseChange(0);
        }

        // Calculate expense trend for the last 7 months
        const trendData: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthName = format(date, 'MMMM yyyy');
            trendData[monthName] = 0;
        }

        allExpenses.forEach(e => {
            if (trendData.hasOwnProperty(e.month)) {
                trendData[e.month] += e.amount;
            }
        });
        
        const sortedTrend = Array.from({length: 7}, (_, i) => {
            const date = subMonths(now, 6-i);
            const monthName = format(date, 'MMMM yyyy');
            const shortMonthName = format(date, 'MMM');
            return {
                month: shortMonthName,
                amount: trendData[monthName] || 0
            };
        })
        setExpenseTrend(sortedTrend);

        // Calculate expense by category for the current month
        const expenseByCategoryData: Record<string, number> = {};
        allExpenses
            .filter(r => r.month === currentMonthName)
            .forEach(r => {
                if (!expenseByCategoryData[r.category]) {
                    expenseByCategoryData[r.category] = 0;
                }
                expenseByCategoryData[r.category] += r.amount;
            });
        
        const expenseChartColors = ["hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-3))", "hsl(var(--chart-2))", "hsl(var(--chart-1))"];
        const categoryChartData = Object.entries(expenseByCategoryData)
            .map(([categoryName, totalExpense], index) => ({
                name: categoryName,
                expense: totalExpense,
                fill: expenseChartColors[index % expenseChartColors.length],
            }))
            .sort((a,b) => b.expense - a.expense);

        setExpenseByCategory(categoryChartData);
    });


    return () => {
        unsubscribeTeam();
        unsubscribeRevenues();
        unsubscribeExpenses();
    };
  }, [toast]);
  
  React.useEffect(() => {
    const profit = monthlyRevenue - monthlyExpenses;
    setMonthlyProfit(profit);
  }, [monthlyRevenue, monthlyExpenses]);


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
    }, 1000); // Save after 1 second of inactivity

    return () => {
      clearTimeout(handler);
    };
  }, [notes, currentUserData, toast]);


  React.useEffect(() => {
    if (team.length === 0 || timeEntries.length === 0) return;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const performanceData = team.map(member => {
        const hoursThisMonth = timeEntries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entry.teamMember.toLowerCase() === member.name.toLowerCase() &&
                       entryDate.getFullYear() === currentYear &&
                       entryDate.getMonth() === currentMonth;
            })
            .reduce((total, entry) => total + entry.duration, 0);
        
        return {
            id: member.id,
            name: member.name,
            role: member.role,
            hoursThisMonth: hoursThisMonth,
            photoURL: member.photoURL
        };
    });
    setTeamPerformance(performanceData);
  }, [team, timeEntries]);

  const handleRateEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMemberForRateEdit) return;

    const formData = new FormData(event.currentTarget);
    const newRate = parseFloat(formData.get("hourlyRate") as string);

    if (isNaN(newRate) || newRate < 0) {
        toast({ title: "Invalid Input", description: "Please enter a valid, non-negative number for the hourly rate.", variant: "destructive" });
        return;
    }

    const updatedMember: TeamMember = {
        ...selectedMemberForRateEdit,
        hourlyrate: newRate,
    };

    try {
        await updateTeamMember(updatedMember);
        // State will be updated by the real-time listener
        setIsRateEditDialogOpen(false);
        toast({ title: "Success", description: "Hourly rate updated successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not update hourly rate.", variant: "destructive" });
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left">Dashboard</h1>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Month's Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyRevenue.toLocaleString()} kr
              </div>
              <p className="text-xs text-muted-foreground">
                {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Month's Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyExpenses.toLocaleString()} kr
              </div>
              <p className="text-xs text-muted-foreground">
                 {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Month's Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyProfit.toLocaleString()} kr
              </div>
              <p className="text-xs text-muted-foreground">
                &nbsp;
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Content Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {doneContentCount}/{totalContentCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed this month
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>Last 7 months performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RevenueChart data={revenueTrend} />
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Revenue by Client</CardTitle>
                    <CardDescription>This month's revenue distribution.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RevenueByClientChart data={revenueByClient} />
                </CardContent>
            </Card>
        </div>
         <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Expenses Over Time</CardTitle>
                    <CardDescription>Last 7 months spending.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseChart data={expenseTrend} />
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>This month's spending distribution.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseByCategoryChart data={expenseByCategory} />
                </CardContent>
            </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Monthly stats for each team member.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {isLoadingTeam ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))
              ) : teamPerformance.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                   <Avatar className="h-12 w-12">
                    <AvatarImage src={member.photoURL} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{member.hoursThisMonth.toFixed(1)} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
        <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hourly Rates</CardTitle>
              <CardDescription>Current hourly rates for each team member.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {isLoadingTeam ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))
                ) : team.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                   <Avatar className="h-12 w-12">
                    <AvatarImage src={member.photoURL} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{(member.hourlyrate || 0).toLocaleString()} kr / hour</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        setSelectedMemberForRateEdit(member);
                        setIsRateEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit Rate</span>
                  </Button>
                </div>
              ))}
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

       <Dialog open={isRateEditDialogOpen} onOpenChange={setIsRateEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hourly Rate</DialogTitle>
            <DialogDescription>
              Update the hourly rate for {selectedMemberForRateEdit?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedMemberForRateEdit && (
            <form onSubmit={handleRateEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hourlyRate" className="text-right">
                    Hourly Rate (kr)
                  </Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    step="0.01"
                    defaultValue={selectedMemberForRateEdit.hourlyrate}
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
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

    