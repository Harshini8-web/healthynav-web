import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Workouts = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: workouts } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: catalog } = useQuery({
    queryKey: ['workout-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_catalog')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const addWorkout = useMutation({
    mutationFn: async (workout: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const selectedWorkout = catalog?.find(w => w.id === workout.workout_id);
      const caloriesBurned = selectedWorkout?.calories_per_hour 
        ? Math.round((selectedWorkout.calories_per_hour / 60) * workout.duration_minutes)
        : null;

      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          workout_id: workout.workout_id,
          workout_name: selectedWorkout?.name || '',
          date: workout.date,
          duration_minutes: workout.duration_minutes,
          calories_burned: caloriesBurned,
          notes: workout.notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-stats'] });
      setOpen(false);
      toast({ title: "Workout logged successfully!" });
    },
  });

  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast({ title: "Workout deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addWorkout.mutate({
      workout_id: formData.get('workout'),
      date: formData.get('date'),
      duration_minutes: parseInt(formData.get('duration') as string),
      notes: formData.get('notes'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Workouts</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Workout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a Workout</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workout">Workout Type</Label>
                <Select name="workout" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workout" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog?.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full" disabled={addWorkout.isPending}>
                {addWorkout.isPending ? 'Logging...' : 'Log Workout'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {workouts?.map(workout => (
          <Card key={workout.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{workout.workout_name}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteWorkout.mutate(workout.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(workout.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{workout.duration_minutes} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Calories</p>
                  <p className="font-medium">{workout.calories_burned || 'N/A'}</p>
                </div>
              </div>
              {workout.notes && (
                <p className="mt-2 text-sm text-muted-foreground">{workout.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Workouts;
