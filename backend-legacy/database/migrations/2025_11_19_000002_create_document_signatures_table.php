<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDocumentSignaturesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('document_signatures', function (Blueprint $table) {
            $table->increments('docsig_id');
            $table->integer('stdmod_id')->unsigned();
            $table->string('docsig_document_type', 50); // contract, certification, bank_letter, code_conduct, habeas_data
            $table->integer('docsig_signed_by_user_id')->unsigned();
            $table->string('docsig_role', 20); // model, owner
            $table->integer('usrsig_id')->unsigned()->nullable();
            $table->string('docsig_ip_address', 45)->nullable();
            $table->text('docsig_user_agent')->nullable();
            $table->datetime('docsig_signed_at');
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();

            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
            $table->foreign('docsig_signed_by_user_id')->references('user_id')->on('users');
            $table->foreign('usrsig_id')->references('usrsig_id')->on('user_signatures');

            // Índices para optimizar consultas
            $table->index(['stdmod_id', 'docsig_document_type', 'docsig_role'], 'idx_stdmod_doctype_role');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('document_signatures');
    }
}

