import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Dumbbell, Utensils, Droplet, Moon } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: workoutStats } = useQuery({
    queryKey: ['workout-stats', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { count: 0, calories: 0 };
      
      const { data } = await supabase
        .from('workout_logs')
        .select('calories_burned')
        .eq('user_id', user.id)
        .eq('date', today);
      
      return {
        count: data?.length || 0,
        calories: data?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0
      };
    },
  });

  const { data: dietStats } = useQuery({
    queryKey: ['diet-stats', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { calories: 0, protein: 0 };
      
      const { data } = await supabase
        .from('diet_logs')
        .select('calories, protein_g')
        .eq('user_id', user.id)
        .eq('date', today);
      
      return {
        calories: data?.reduce((sum, d) => sum + (d.calories || 0), 0) || 0,
        protein: data?.reduce((sum, d) => sum + (d.protein_g || 0), 0) || 0
      };
    },
  });

  const { data: hydrationStats } = useQuery({
    queryKey: ['hydration-stats', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { data } = await supabase
        .from('hydration_logs')
        .select('amount_ml')
        .eq('user_id', user.id)
        .eq('date', today);
      
      return data?.reduce((sum, h) => sum + (h.amount_ml || 0), 0) || 0;
    },
  });

  const stats = [
    {
      title: 'Workouts Today',
      value: workoutStats?.count || 0,
      icon: Dumbbell,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Calories Burned',
      value: workoutStats?.calories || 0,
      icon: Activity,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Calories Consumed',
      value: dietStats?.calories || 0,
      icon: Utensils,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Water Intake (ml)',
      value: hydrationStats || 0,
      icon: Droplet,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome back, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2">Here's your fitness overview for today</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">BMI</span>
            <span className="font-semibold">
              {profile?.height_cm && profile?.weight_kg
                ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Subscription</span>
            <span className="font-semibold capitalize">{profile?.subscription_tier || 'Normal'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Fitness Goal</span>
            <span className="font-semibold">{profile?.fitness_goal || 'Not set'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
