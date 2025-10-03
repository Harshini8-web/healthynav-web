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

const Diet = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: dietLogs } = useQuery({
    queryKey: ['diet-logs', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('diet_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addDietLog = useMutation({
    mutationFn: async (log: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('diet_logs')
        .insert({
          user_id: user.id,
          ...log,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-logs'] });
      queryClient.invalidateQueries({ queryKey: ['diet-stats'] });
      setOpen(false);
      toast({ title: "Meal logged successfully!" });
    },
  });

  const deleteDietLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('diet_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-logs'] });
      toast({ title: "Meal deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addDietLog.mutate({
      date: formData.get('date'),
      meal_type: formData.get('mealType'),
      food_name: formData.get('foodName'),
      calories: parseInt(formData.get('calories') as string),
      protein_g: parseInt(formData.get('protein') as string) || 0,
      carbs_g: parseInt(formData.get('carbs') as string) || 0,
      fat_g: parseInt(formData.get('fat') as string) || 0,
    });
  };

  const totalCalories = dietLogs?.reduce((sum, log) => sum + log.calories, 0) || 0;
  const totalProtein = dietLogs?.reduce((sum, log) => sum + log.protein_g, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Diet Tracking</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a Meal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mealType">Meal Type</Label>
                <Select name="mealType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodName">Food Name</Label>
                <Input id="foodName" name="foodName" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input id="calories" name="calories" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input id="protein" name="protein" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input id="carbs" name="carbs" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input id="fat" name="fat" type="number" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addDietLog.isPending}>
                {addDietLog.isPending ? 'Logging...' : 'Log Meal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Today's Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Calories</span>
              <span className="font-bold">{totalCalories}</span>
            </div>
            <div className="flex justify-between">
              <span>Protein</span>
              <span className="font-bold">{totalProtein}g</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Today's Meals</h2>
        {dietLogs?.map(log => (
          <Card key={log.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg capitalize">{log.meal_type}: {log.food_name}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteDietLog.mutate(log.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Calories</p>
                  <p className="font-medium">{log.calories}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Protein</p>
                  <p className="font-medium">{log.protein_g}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Carbs</p>
                  <p className="font-medium">{log.carbs_g}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fat</p>
                  <p className="font-medium">{log.fat_g}g</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Diet;
