import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Entre no sistema</CardTitle>
					<CardDescription>
						Entre com seu email para acessar o sistema
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-3'>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									type='email'
									placeholder='m@example.com'
									required
								/>
							</div>
							<div className='grid gap-3'>
								<div className='flex items-center'>
									<Label htmlFor='password'>Senha</Label>
								</div>
								<Input id='password' type='password' required />
							</div>
							<div className='flex flex-col gap-3'>
								<Button type='submit' className='w-full'>
									Entrar
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
