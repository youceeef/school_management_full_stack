<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function view(User $user)
    {
        return $user->can('show_documents');
    }

    public function create(User $user)
    {
        return $user->can('upload_documents');
    }

    public function delete(User $user, Document $document)
    {
        return $user->id === $document->user_id || $user->can('delete_documents');
    }

    public function download(User $user, Document $document)
    {
        return $user->id === $document->user_id || $user->can('download_documents');
    }

    public function show(User $user, Document $document)
    {
        return $user->id === $document->user_id || $user->can('view_document');
    }
    public function update(User $user, Document $document)
    {
        return $user->id === $document->user_id || $user->can('update_documents');
    }

    public function telechargements(User $user)
    {
        return $user->can('telechargements');
    }
}
