<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'file_path', 'file_type', 'user_id', 'description'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
