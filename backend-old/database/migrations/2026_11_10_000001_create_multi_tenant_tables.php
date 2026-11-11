<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('tenants',function(Blueprint $t){$t->id();$t->string('name');$t->string('slug')->unique();$t->timestamps();});
  Schema::create('tenant_user',function(Blueprint $t){$t->id();$t->foreignId('tenant_id')->constrained()->cascadeOnDelete();$t->foreignId('user_id')->constrained()->cascadeOnDelete();$t->string('role',30)->default('employee');$t->timestamps();$t->unique(['tenant_id','user_id']);$t->index(['user_id','tenant_id']);});
  Schema::create('projects',function(Blueprint $t){$t->id();$t->foreignId('tenant_id')->constrained()->cascadeOnDelete();$t->string('name');$t->text('description')->nullable();$t->string('status',30)->default('planning');$t->date('due_date')->nullable();$t->timestamps();$t->index(['tenant_id','created_at']);});
  Schema::create('tasks',function(Blueprint $t){$t->id();$t->foreignId('tenant_id')->constrained()->cascadeOnDelete();$t->foreignId('project_id')->constrained()->cascadeOnDelete();$t->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();$t->string('title');$t->text('description')->nullable();$t->string('status',30)->default('todo');$t->string('priority',20)->default('medium');$t->date('due_date')->nullable();$t->timestamps();$t->index(['tenant_id','project_id']);$t->index(['tenant_id','status']);});
 }
 public function down(): void {Schema::dropIfExists('tasks');Schema::dropIfExists('projects');Schema::dropIfExists('tenant_user');Schema::dropIfExists('tenants');}
};
