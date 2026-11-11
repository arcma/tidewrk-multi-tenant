<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
class AuthController extends Controller {
    public function register(Request $r) {
        $d=$r->validate(['name'=>'required|string|max:120','email'=>'required|email|unique:users,email','password'=>'required|string|min:8|confirmed','company_name'=>'required|string|max:150']);
        [$u,$t]=DB::transaction(function() use($d) {
            $u=User::create(['name'=>$d['name'],'email'=>$d['email'],'password'=>$d['password']]);
            $t=Tenant::create(['name'=>$d['company_name'],'slug'=>Str::slug($d['company_name']).'-'.Str::lower(Str::random(6))]);
            $t->users()->attach($u->id,['role'=>'admin']);
            return [$u,$t];
        });
        return response()->json(['token'=>$u->createToken('web')->plainTextToken,'user'=>$u,'tenant'=>$t,'role'=>'admin'],201);
    }
    public function login(Request $r) {
        $d=$r->validate(['email'=>'required|email','password'=>'required|string']);
        if(!Auth::attempt($d)) throw ValidationException::withMessages(['email'=>['Credentials are incorrect.']]);
        $u=User::where('email',$d['email'])->firstOrFail(); $t=$u->tenants()->first();
        abort_unless($t,403,'No workspace membership.');
        return response()->json(['token'=>$u->createToken('web')->plainTextToken,'user'=>$u,'tenant'=>$t,'role'=>$t->pivot->role]);
    }
    public function me(Request $r) { return response()->json(['user'=>$r->user(),'tenants'=>$r->user()->tenants()->get()]); }
    public function logout(Request $r) { $r->user()->currentAccessToken()?->delete(); return response()->json(['message'=>'Logged out']); }
}
