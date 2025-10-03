import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Droplet, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

const Hydration = () => {
  const [amount, setAmount] = useState('250');
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const dailyGoal = 2000; // ml

  const { data: hydrationLogs } = useQuery({
    queryKey: ['hydration-logs', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('time', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addHydration = useMutation({
    mutationFn: async (amount_ml: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const now = new Date();
      const { error } = await supabase
        .from('hydration_logs')
        .insert({
          user_id: user.id,
          date: today,
          time: format(now, 'HH:mm:ss'),
          amount_ml,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hydration-logs'] });
      queryClient.invalidateQueries({ queryKey: ['hydration-stats'] });
      setAmount('250');
      toast({ title: "Water intake logged!" });
    },
  });

  const totalIntake = hydrationLogs?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
  const progress = Math.min((totalIntake / dailyGoal) * 100, 100);

  const quickAmounts = [250, 500, 750, 1000];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Hydration Tracking</h1>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-6 w-6 text-blue-500" />
            Today's Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
              {totalIntake}ml
            </div>
            <div className="text-muted-foreground">of {dailyGoal}ml goal</div>
          </div>
          
          <Progress value={progress} className="h-3" />
          
          <div className="text-center text-sm text-muted-foreground">
            {progress >= 100 ? '🎉 Goal achieved!' : `${Math.round(progress)}% complete`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Water Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount in ml"
            />
            <Button onClick={() => addHydration.mutate(parseInt(amount))}>
              <Plus className="mr-2 h-4 w-4" />
              Log
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map(amt => (
              <Button
                key={amt}
                variant="outline"
                onClick={() => addHydration.mutate(amt)}
              >
                {amt}ml
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hydrationLogs?.map(log => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <span className="font-medium">{log.amount_ml}ml</span>
                <span className="text-sm text-muted-foreground">{log.time}</span>
              </div>
            ))}
            {!hydrationLogs?.length && (
              <p className="text-center text-muted-foreground py-4">No water logged today</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Hydration;
