<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class SetTenantContext {
    public function handle(Request $request, Closure $next): Response {
        $user = $request->user();
        abort_unless($user, 401);
        $memberships = $user->tenants();
        $requested = $request->header('X-Tenant-ID');
        $tenant = $requested ? $memberships->where('tenants.id',$requested)->first() : $memberships->first();
        abort_unless($tenant, 403, 'No access to this workspace.');
        $request->attributes->set('currentTenant',$tenant);
        $request->attributes->set('currentTenantRole',$tenant->pivot->role);
        return $next($request);
    }
}
