<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
class TaskController extends Controller {
    private function tid(Request $r): int { return (int)$r->attributes->get('currentTenant')->id; }
    private function role(Request $r): string { return (string)$r->attributes->get('currentTenantRole'); }
    public function index(Request $r,int $project) {
        $tid=$this->tid($r); $p=Project::where('tenant_id',$tid)->findOrFail($project);
        return Task::where('tenant_id',$tid)->where('project_id',$p->id)->with('assignee:id,name,email')->latest()->get();
    }
    public function store(Request $r,int $project) {
        abort_unless(in_array($this->role($r),['admin','manager','employee']),403);
        $tid=$this->tid($r); $p=Project::where('tenant_id',$tid)->findOrFail($project);
        $d=$r->validate(['title'=>'required|string|max:180','description'=>'nullable|string','status'=>'nullable|in:todo,in_progress,done','priority'=>'nullable|in:low,medium,high','assigned_to'=>['nullable',Rule::exists('tenant_user','user_id')->where('tenant_id',$tid)],'due_date'=>'nullable|date']);
        return response()->json(Task::create($d+['tenant_id'=>$tid,'project_id'=>$p->id]),201);
    }
    public function update(Request $r,int $task) {
        abort_unless(in_array($this->role($r),['admin','manager','employee']),403);
        $tid=$this->tid($r); $t=Task::where('tenant_id',$tid)->findOrFail($task);
        $t->update($r->validate(['title'=>'sometimes|required|string|max:180','description'=>'nullable|string','status'=>'sometimes|in:todo,in_progress,done','priority'=>'sometimes|in:low,medium,high','assigned_to'=>['nullable',Rule::exists('tenant_user','user_id')->where('tenant_id',$tid)],'due_date'=>'nullable|date']));
        return $t;
    }
    public function destroy(Request $r,int $task) {
        abort_unless(in_array($this->role($r),['admin','manager']),403);
        Task::where('tenant_id',$this->tid($r))->findOrFail($task)->delete();
        return response()->json(['message'=>'Task deleted']);
    }
}
