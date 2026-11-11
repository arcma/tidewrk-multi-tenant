<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
class ProjectController extends Controller {
    private function tid(Request $r): int { return (int)$r->attributes->get('currentTenant')->id; }
    private function role(Request $r): string { return (string)$r->attributes->get('currentTenantRole'); }
    public function index(Request $r) { return Project::where('tenant_id',$this->tid($r))->withCount('tasks')->latest()->paginate(15); }
    public function store(Request $r) {
        abort_unless(in_array($this->role($r),['admin','manager']),403);
        $d=$r->validate(['name'=>'required|string|max:150','description'=>'nullable|string','status'=>'nullable|in:planning,active,completed,on_hold','due_date'=>'nullable|date']);
        return response()->json(Project::create($d+['tenant_id'=>$this->tid($r)]),201);
    }
    public function show(Request $r,int $project) { return Project::where('tenant_id',$this->tid($r))->with('tasks')->findOrFail($project); }
    public function update(Request $r,int $project) {
        abort_unless(in_array($this->role($r),['admin','manager']),403);
        $p=Project::where('tenant_id',$this->tid($r))->findOrFail($project);
        $p->update($r->validate(['name'=>'sometimes|required|string|max:150','description'=>'nullable|string','status'=>'sometimes|in:planning,active,completed,on_hold','due_date'=>'nullable|date']));
        return $p;
    }
    public function destroy(Request $r,int $project) {
        abort_unless($this->role($r)==='admin',403);
        Project::where('tenant_id',$this->tid($r))->findOrFail($project)->delete();
        return response()->json(['message'=>'Project deleted']);
    }
}
