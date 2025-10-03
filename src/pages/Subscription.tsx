import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown } from 'lucide-react';

const Subscription = () => {
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

  const isPro = profile?.subscription_tier === 'pro';

  const features = {
    normal: [
      'Basic workout tracking',
      'Diet logging',
      'Hydration monitoring',
      'Sleep tracking',
      'Dashboard analytics',
    ],
    pro: [
      'Everything in Normal',
      'Advanced analytics & insights',
      'Personalized AI workout plans',
      'Personalized AI diet suggestions',
      'Priority support',
      'Export data',
    ],
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground">Choose the plan that fits your fitness journey</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className={!isPro ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="text-2xl">Normal</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">Free</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.normal.map(feature => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {!isPro && (
              <Button className="w-full" disabled>
                Current Plan
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={isPro ? 'ring-2 ring-accent border-accent' : 'border-accent/50'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                Pro
                <Crown className="h-5 w-5 text-accent" />
              </CardTitle>
              <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full font-semibold">
                POPULAR
              </span>
            </div>
            <CardDescription>For serious fitness enthusiasts</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.pro.map(feature => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
              disabled={isPro}
            >
              {isPro ? 'Current Plan' : 'Upgrade to Pro'}
            </Button>
            {!isPro && (
              <p className="text-xs text-center text-muted-foreground">
                Payment integration coming soon
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {isPro && (
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-accent" />
              <div>
                <p className="font-semibold">You're a Pro member!</p>
                <p className="text-sm text-muted-foreground">
                  Enjoy all premium features and personalized AI recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Subscription;
