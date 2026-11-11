<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Project extends Model {
    protected $fillable = ['tenant_id','name','description','status','due_date'];
    protected $casts = ['due_date'=>'date'];
    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
    public function tasks(): HasMany { return $this->hasMany(Task::class); }
}
