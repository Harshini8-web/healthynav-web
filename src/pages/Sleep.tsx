import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Moon } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';

const Sleep = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sleepLogs } = useQuery({
    queryKey: ['sleep-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const addSleepLog = useMutation({
    mutationFn: async (log: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('sleep_logs')
        .insert({
          user_id: user.id,
          ...log,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-logs'] });
      setOpen(false);
      toast({ title: "Sleep log added!" });
    },
  });

  const deleteSleepLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-logs'] });
      toast({ title: "Sleep log deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const date = formData.get('date') as string;
    const bedTime = formData.get('bedTime') as string;
    const wakeTime = formData.get('wakeTime') as string;
    
    // Parse the date and times properly
    const [bedHours, bedMinutes] = bedTime.split(':').map(Number);
    const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
    
    // Create date objects for bed time and wake time
    const bedDateTime = new Date(date);
    bedDateTime.setHours(bedHours, bedMinutes, 0, 0);
    
    const wakeDateTime = new Date(date);
    wakeDateTime.setHours(wakeHours, wakeMinutes, 0, 0);
    
    // If wake time is before bed time, it means next day
    if (wakeDateTime <= bedDateTime) {
      wakeDateTime.setDate(wakeDateTime.getDate() + 1);
    }
    
    addSleepLog.mutate({
      date,
      bed_time: bedDateTime.toISOString(),
      wake_time: wakeDateTime.toISOString(),
      quality: formData.get('quality'),
      notes: formData.get('notes'),
    });
  };

  const calculateDuration = (bedTime: string, wakeTime: string) => {
    const bed = new Date(bedTime);
    const wake = new Date(wakeTime);
    
    const totalMinutes = differenceInMinutes(wake, bed);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Sleep Tracking</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Sleep
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Sleep</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedTime">Bed Time</Label>
                <Input
                  id="bedTime"
                  name="bedTime"
                  type="time"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wakeTime">Wake Time</Label>
                <Input
                  id="wakeTime"
                  name="wakeTime"
                  type="time"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quality">Sleep Quality</Label>
                <Select name="quality" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full" disabled={addSleepLog.isPending}>
                {addSleepLog.isPending ? 'Logging...' : 'Log Sleep'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sleepLogs?.map(log => (
          <Card key={log.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">
                  {format(new Date(log.date), 'MMM dd, yyyy')}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSleepLog.mutate(log.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{calculateDuration(log.bed_time, log.wake_time)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quality</p>
                  <p className="font-medium capitalize">{log.quality}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bed Time</p>
                  <p className="font-medium">{format(new Date(log.bed_time), 'HH:mm')}</p>
                </div>
              </div>
              {log.notes && (
                <p className="mt-2 text-sm text-muted-foreground">{log.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Sleep;
