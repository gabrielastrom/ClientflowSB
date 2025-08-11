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
import { type Revenue, type Client, type Expense, type TeamMember, type TimeEntry } from "@/lib/types";
import { PlusCircle, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, MinusCircle } from "lucide-react";
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
import { getClients } from "@/services/clientService";
import { listenToRevenues, addRevenue, updateRevenue, deleteRevenue } from "@/services/revenueService";
import { listenToExpenses, addExpense, updateExpense, deleteExpense } from "@/services/expenseService";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { listenToTeamMembers } from "@/services/teamService";
import { getTimeEntries } from "@/services/timeTrackingService";

type SortableRevenueKeys = keyof Revenue;
type SortableExpenseKeys = keyof Expense;

export default function FinancePage() {
  const [revenues, setRevenues] = React.useState<Revenue[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [timeEntries, setTimeEntries] = React.useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [selectedRevenue, setSelectedRevenue] = React.useState<Revenue | null>(null);
  const [isAddRevenueOpen, setIsAddRevenueOpen] = React.useState(false);
  const [isEditRevenueOpen, setIsEditRevenueOpen] = React.useState(false);
  const [isDeleteRevenueAlertOpen, setIsDeleteRevenueAlertOpen] = React.useState(false);

  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = React.useState(false);
  const [isDeleteExpenseAlertOpen, setIsDeleteExpenseAlertOpen] = React.useState(false);

  const [sortConfigRevenue, setSortConfigRevenue] = React.useState<{ key: SortableRevenueKeys; direction: 'ascending' | 'descending' } | null>(null);
  const [sortConfigExpense, setSortConfigExpense] = React.useState<{ key: SortableExpenseKeys; direction: 'ascending' | 'descending' } | null>(null);

  const [expenseFormData, setExpenseFormData] = React.useState<{category: string, member: string, month: string}>({category: '', member: '', month: format(new Date(), "MMMM yyyy")});
  const [calculatedSalary, setCalculatedSalary] = React.useState<number | null>(null);
  const [salaryComment, setSalaryComment] = React.useState('');
  
  const { toast } = useToast();

  const monthOptions = React.useMemo(() => {
    const options: string[] = [];
    const today = new Date();
    for (let i = -6; i <= 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        options.push(format(date, 'MMMM yyyy'));
    }
    return options;
  }, []);

  React.useEffect(() => {
    let active = true;
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clientData, timeEntriesData] = await Promise.all([
          getClients(),
          getTimeEntries()
        ]);
        if (active) {
            setClients(clientData);
            setTimeEntries(timeEntriesData);
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch initial data.", variant: "destructive" });
      }
    }
    
    fetchData();

    const unsubscribeRevenues = listenToRevenues((revenuesData) => {
        if (active) setRevenues(revenuesData);
    });

    const unsubscribeExpenses = listenToExpenses((expensesData) => {
        if (active) setExpenses(expensesData);
    });

    const unsubscribeTeam = listenToTeamMembers((teamData) => {
        if (active) {
            setTeamMembers(teamData);
            setIsLoading(false);
        }
    });

    return () => {
        active = false;
        unsubscribeRevenues();
        unsubscribeExpenses();
        unsubscribeTeam();
    };

  }, [toast]);

  React.useEffect(() => {
    if (expenseFormData.category !== 'Salaries' || !expenseFormData.member || !expenseFormData.month) {
      setCalculatedSalary(null);
      setSalaryComment('');
      return;
    }

    const member = teamMembers.find(m => m.id === expenseFormData.member);
    if (!member) {
      setCalculatedSalary(null);
      setSalaryComment('');
      return;
    }
    
    const [monthStr, yearStr] = expenseFormData.month.split(' ');
    const monthIndex = new Date(Date.parse(monthStr +" 1, 2012")).getMonth();
    const year = parseInt(yearStr, 10);

    const hoursThisMonth = timeEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.teamMember.toLowerCase() === member.name.toLowerCase() &&
               entryDate.getFullYear() === year &&
               entryDate.getMonth() === monthIndex;
      })
      .reduce((total, entry) => total + entry.duration, 0);
    
    const salary = hoursThisMonth * (member.hourlyrate || 0);
    setCalculatedSalary(salary);
    setSalaryComment(`Salary for ${member.name} - ${expenseFormData.month}`);

  }, [expenseFormData, timeEntries, teamMembers]);


  const sortedRevenues = React.useMemo(() => {
    let sortableItems = [...revenues];
    if (sortConfigRevenue !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number = a[sortConfigRevenue.key];
        let bValue: string | number = b[sortConfigRevenue.key];
  
        if (sortConfigRevenue.key === 'revenue') {
          aValue = a.revenue;
          bValue = b.revenue;
        } else if (sortConfigRevenue.key === 'month') {
          aValue = new Date(`1 ${a.month}`).getTime();
          bValue = new Date(`1 ${b.month}`).getTime();
        }
  
        if (aValue < bValue) {
          return sortConfigRevenue.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfigRevenue.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [revenues, sortConfigRevenue]);

  const sortedExpenses = React.useMemo(() => {
    let sortableItems = [...expenses];
    if (sortConfigExpense !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number = a[sortConfigExpense.key];
        let bValue: string | number = b[sortConfigExpense.key];
  
        if (sortConfigExpense.key === 'amount') {
          aValue = a.amount;
          bValue = b.amount;
        } else if (sortConfigExpense.key === 'month') {
          aValue = new Date(`1 ${a.month}`).getTime();
          bValue = new Date(`1 ${b.month}`).getTime();
        }
  
        if (aValue < bValue) {
          return sortConfigExpense.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfigExpense.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [expenses, sortConfigExpense]);

  const requestSortRevenue = (key: SortableRevenueKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfigRevenue && sortConfigRevenue.key === key && sortConfigRevenue.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfigRevenue({ key, direction });
  };

  const requestSortExpense = (key: SortableExpenseKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfigExpense && sortConfigExpense.key === key && sortConfigExpense.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfigExpense({ key, direction });
  };
  
  const getSortIcon = (key: string, type: 'revenue' | 'expense') => {
    const config = type === 'revenue' ? sortConfigRevenue : sortConfigExpense;
    if (!config || config.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (config.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleAddRevenueSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newRevenueData: Omit<Revenue, "id"> = {
      revenue: parseFloat(formData.get("revenue") as string),
      month: formData.get("month") as string,
      client: formData.get("client") as string,
      comment: formData.get("comment") as string,
    };

    try {
        await addRevenue(newRevenueData);
        setIsAddRevenueOpen(false);
        toast({ title: "Success", description: "Revenue added successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not add revenue.", variant: "destructive" });
    }
  };
  
  const handleEditRevenueSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRevenue) return;

    const formData = new FormData(event.currentTarget);
    const updatedRevenue: Revenue = {
      ...selectedRevenue,
      revenue: parseFloat(formData.get("revenue") as string),
      month: formData.get("month") as string,
      client: formData.get("client") as string,
      comment: formData.get("comment") as string,
    };
    
    try {
        await updateRevenue(updatedRevenue);
        setIsEditRevenueOpen(false);
        toast({ title: "Success", description: "Revenue updated successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not update revenue.", variant: "destructive" });
    }
  };

  const handleDeleteRevenue = async () => {
    if (!selectedRevenue) return;
    try {
        await deleteRevenue(selectedRevenue.id);
        setIsDeleteRevenueAlertOpen(false);
        toast({
          title: "Revenue Deleted",
          description: `The revenue entry has been removed.`,
        });
    } catch (error) {
         toast({ title: "Error", description: "Could not delete revenue.", variant: "destructive" });
    }
  };

  const handleAddExpenseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    let amount = parseFloat(formData.get("amount") as string);
    
    let comment = formData.get("comment") as string;
    
    const newExpenseData: Omit<Expense, "id"> = {
      amount,
      month: expenseFormData.month,
      category: expenseFormData.category,
      comment,
    };

    try {
        await addExpense(newExpenseData);
        setIsAddExpenseOpen(false);
        toast({ title: "Success", description: "Expense added successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not add expense.", variant: "destructive" });
    }
  };
  
  const handleEditExpenseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedExpense) return;

    const formData = new FormData(event.currentTarget);
    const updatedExpense: Expense = {
      ...selectedExpense,
      amount: parseFloat(formData.get("amount") as string),
      month: formData.get("month") as string,
      category: formData.get("category") as string,
      comment: formData.get("comment") as string,
    };
    
    try {
        await updateExpense(updatedExpense);
        setIsEditExpenseOpen(false);
        toast({ title: "Success", description: "Expense updated successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not update expense.", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    try {
        await deleteExpense(selectedExpense.id);
        setIsDeleteExpenseAlertOpen(false);
        toast({ title: "Expense Deleted", description: `The expense entry has been removed.` });
    } catch (error) {
         toast({ title: "Error", description: "Could not delete expense.", variant: "destructive" });
    }
  };

  const expenseCategories = ["Salaries", "Software", "Marketing", "Office Supplies", "Other"];

  const openAddExpenseDialog = () => {
    setExpenseFormData({category: '', member: '', month: format(new Date(), "MMMM yyyy")});
    setCalculatedSalary(null);
    setSalaryComment('');
    setIsAddExpenseOpen(true);
  }
  
  const openEditExpenseDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditExpenseOpen(true);
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:pb-2">Finance</h1>
          <div className="flex flex-col gap-2 mt-4 sm:mt-0 sm:flex-row">
            <Button onClick={() => setIsAddRevenueOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Revenue
            </Button>
            <Button onClick={openAddExpenseDialog} variant="secondary">
                <MinusCircle className="mr-2 h-4 w-4" />
                Add Expense
            </Button>
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>
                En lista över bolagets intäkter.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[120px]">
                        <Button variant="ghost" onClick={() => requestSortRevenue('revenue')}>
                        Revenue
                        {getSortIcon('revenue', 'revenue')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSortRevenue('client')}>
                        Client
                        {getSortIcon('client', 'revenue')}
                        </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                        <Button variant="ghost" onClick={() => requestSortRevenue('month')}>
                        Month
                        {getSortIcon('month', 'revenue')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSortRevenue('comment')}>
                        Comment
                        {getSortIcon('comment', 'revenue')}
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
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                    ) : sortedRevenues.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No revenue entries found.
                            </TableCell>
                        </TableRow>
                    ) : (
                    sortedRevenues.map((item) => (
                        <TableRow key={item.id}>
                        <TableCell className="font-medium">
                            {item.revenue.toLocaleString()} kr
                        </TableCell>
                        <TableCell>{item.client}</TableCell>
                        <TableCell className="hidden md:table-cell">
                            {item.month}
                        </TableCell>
                        <TableCell>{item.comment}</TableCell>
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
                                <DropdownMenuItem onSelect={() => { setSelectedRevenue(item); setIsEditRevenueOpen(true); }}>
                                Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedRevenue(item); setIsDeleteRevenueAlertOpen(true); }}>
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
                            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                        ))
                    ) : sortedRevenues.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 rounded-lg border-2 border-dashed">
                            <p>No revenue entries found.</p>
                        </div>
                    ) : (
                        sortedRevenues.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-lg">{item.revenue.toLocaleString()} kr</p>
                                    <p className="text-sm font-medium">{item.client}</p>
                                    <p className="text-sm text-muted-foreground">{item.month}</p>
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
                                        <DropdownMenuItem onSelect={() => { setSelectedRevenue(item); setIsEditRevenueOpen(true); }}>Edit</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedRevenue(item); setIsDeleteRevenueAlertOpen(true); }}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {item.comment && (
                                <p className="text-sm text-muted-foreground pt-2 border-t mt-2">{item.comment}</p>
                            )}
                            </CardContent>
                        </Card>
                        ))
                    )}
                </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
                En lista över bolagets utgifter.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[120px]">
                        <Button variant="ghost" onClick={() => requestSortExpense('amount')}>
                        Amount
                        {getSortIcon('amount', 'expense')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSortExpense('category')}>
                        Category
                        {getSortIcon('category', 'expense')}
                        </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                        <Button variant="ghost" onClick={() => requestSortExpense('month')}>
                        Month
                        {getSortIcon('month', 'expense')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSortExpense('comment')}>
                        Comment
                        {getSortIcon('comment', 'expense')}
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
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                    ) : sortedExpenses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No expense entries found.
                            </TableCell>
                        </TableRow>
                    ) : (
                    sortedExpenses.map((item) => (
                        <TableRow key={item.id}>
                        <TableCell className="font-medium">
                            {item.amount.toLocaleString()} kr
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="hidden md:table-cell">
                            {item.month}
                        </TableCell>
                        <TableCell>{item.comment}</TableCell>
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
                                <DropdownMenuItem onSelect={() => openEditExpenseDialog(item)}>
                                Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedExpense(item); setIsDeleteExpenseAlertOpen(true); }}>
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
                            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                        ))
                    ) : sortedExpenses.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 rounded-lg border-2 border-dashed">
                            <p>No expense entries found.</p>
                        </div>
                    ) : (
                        sortedExpenses.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-lg">{item.amount.toLocaleString()} kr</p>
                                    <p className="text-sm font-medium">{item.category}</p>
                                    <p className="text-sm text-muted-foreground">{item.month}</p>
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
                                        <DropdownMenuItem onSelect={() => openEditExpenseDialog(item)}>Edit</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedExpense(item); setIsDeleteExpenseAlertOpen(true); }}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {item.comment && (
                                <p className="text-sm text-muted-foreground pt-2 border-t mt-2">{item.comment}</p>
                            )}
                            </CardContent>
                        </Card>
                        ))
                    )}
                </div>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Add/Edit Revenue Dialog */}
      <Dialog open={isAddRevenueOpen || isEditRevenueOpen} onOpenChange={isAddRevenueOpen ? setIsAddRevenueOpen : setIsEditRevenueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddRevenueOpen ? "Add New Revenue" : "Edit Revenue"}</DialogTitle>
            <DialogDescription>
              {isAddRevenueOpen ? "Fill in the details for the new revenue entry." : "Make changes to the revenue entry."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isAddRevenueOpen ? handleAddRevenueSubmit : handleEditRevenueSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="revenue" className="text-right">Revenue</Label>
                <Input id="revenue" name="revenue" type="number" step="100" defaultValue={selectedRevenue?.revenue} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">Client</Label>
                <Select name="client" defaultValue={selectedRevenue?.client}>
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
                <Label htmlFor="month" className="text-right">Month</Label>
                <Select name="month" defaultValue={selectedRevenue?.month || format(new Date(), "MMMM yyyy")}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right">Comment</Label>
                <Input id="comment" name="comment" defaultValue={selectedRevenue?.comment} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">{isAddRevenueOpen ? "Add Revenue" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Revenue Alert */}
      <AlertDialog open={isDeleteRevenueAlertOpen} onOpenChange={setIsDeleteRevenueAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the revenue entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteRevenue}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Add/Edit Expense Dialog */}
      <Dialog open={isAddExpenseOpen || isEditExpenseOpen} onOpenChange={(open) => {
          if (isAddExpenseOpen) setIsAddExpenseOpen(open);
          if (isEditExpenseOpen) setIsEditExpenseOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddExpenseOpen ? "Add New Expense" : "Edit Expense"}</DialogTitle>
            <DialogDescription>
              {isAddExpenseOpen ? "Fill in the details for the new expense entry." : "Make changes to the expense entry."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isAddExpenseOpen ? handleAddExpenseSubmit : handleEditExpenseSubmit}>
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-category" className="text-right">Category</Label>
                <Select name="category" 
                    defaultValue={isEditExpenseOpen ? selectedExpense?.category : expenseFormData.category} 
                    onValueChange={(value) => setExpenseFormData(prev => ({...prev, category: value, member: ''}))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-month" className="text-right">Month</Label>
                <Select name="month"
                    defaultValue={isEditExpenseOpen ? selectedExpense?.month : expenseFormData.month}
                    onValueChange={(value) => setExpenseFormData(prev => ({...prev, month: value}))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              
              {expenseFormData.category === 'Salaries' && isAddExpenseOpen && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-member" className="text-right">Team Member</Label>
                    <Select name="member" value={expenseFormData.member} onValueChange={(value) => setExpenseFormData(prev => ({...prev, member: value}))}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                        <SelectContent>
                            {teamMembers.map(member => (
                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-amount" className="text-right">Amount</Label>
                <Input id="expense-amount" name="amount" type="number" step="100" 
                    key={calculatedSalary} // Re-renders the input when salary is calculated
                    defaultValue={isEditExpenseOpen ? selectedExpense?.amount : (calculatedSalary ?? '')}
                    className="col-span-3" required />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-comment" className="text-right">Comment</Label>
                <Input id="expense-comment" name="comment"
                    key={salaryComment}
                    defaultValue={isEditExpenseOpen ? selectedExpense?.comment : salaryComment}
                    className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">{isAddExpenseOpen ? "Add Expense" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Expense Alert */}
      <AlertDialog open={isDeleteExpenseAlertOpen} onOpenChange={setIsDeleteExpenseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteExpense}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

    

    