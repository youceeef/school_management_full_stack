<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class DocumentController extends Controller
{
    public function upload(Request $request)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $this->authorize('create', Document::class);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'file' => 'required|mimes:pdf,jpg,jpeg,png|max:4096', // 4MB max
        ]);

        $file = $request->file('file');
        $filePath = $file->store('documents', 'public');

        $document = Document::create([
            'title' => $request->title,
            'file_path' => $filePath,
            'file_type' => $file->getClientMimeType(),
            'description' => $request->description,
            'user_id' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Document téléversé avec succès',
            'document' => $document
        ], 201);
    }

    public function index()
    {
        $this->authorize('view', Document::class);

        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $documents = Document::with('user:id,first_name,last_name')->get();
        return response()->json($documents);
    }

    public function telechargements()
    {
        $this->authorize('telechargements', Document::class);
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $telechargements = Document::with('user:id,first_name,last_name')->get();
        return response()->json($telechargements);
    }


    public function download($documentId)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $document = Document::findOrFail($documentId);
        $this->authorize('download', $document);

        return response()->download(storage_path("app/public/{$document->file_path}"));
    }

    public function delete($documentId)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $document = Document::find($documentId);

        if (!$document) {
            return response()->json(['message' => 'Document not found.'], 404);
        }

        $this->authorize('delete', $document);

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document supprimé avec succès']);
    }

    public function show($documentId)
    {
        $document = Document::with('user')->find($documentId);

        if (!$document) {
            return response()->json(['message' => 'Document introuvable'], 404);
        }

        $this->authorize('show', $document);

        // Add user data to the response
        $documentData = $document->toArray();
        $documentData['user_name'] = $document->user ? $document->user->first_name . ' ' . $document->user->last_name : null;

        return response()->json($documentData);
    }
    public function update(Request $request, $documentId)
    {
        $document = Document::findOrFail($documentId);
        $this->authorize('update', $document);

        // Validate only title and description
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        // Update the document
        $document->update($data);

        // Return the updated document with the updated date
        return response()->json([
            'document' => $document,
            'updated_at' => $document->updated_at,
        ]);
    }
}
