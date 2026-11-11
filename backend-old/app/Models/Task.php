<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Task extends Model {
    protected $fillable = ['tenant_id','project_id','title','description','status','priority','assigned_to','due_date'];
    protected $casts = ['due_date'=>'date'];
    public function project(): BelongsTo { return $this->belongsTo(Project::class); }
    public function assignee(): BelongsTo { return $this->belongsTo(User::class,'assigned_to'); }
}
