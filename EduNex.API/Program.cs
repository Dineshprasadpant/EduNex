using EduNex.API;
using EduNex.DataAccess;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new Exception("DefaultConnection not found.");
// Register application services
builder.Services.AddApplicationServices(builder.Configuration);

// Register JWT separately
builder.Services.AddJwtAuthentication(builder.Configuration);

// Custom validation response
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(kvp => kvp.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => JsonNamingPolicy.CamelCase.ConvertName(kvp.Key),
                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
            );

        var body = new
        {
            success = false,
            code = "VALIDATION_ERROR",
            message = "Validation failed",
            errors
        };

        return new UnprocessableEntityObjectResult(body);
    };
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
DatabaseSchema.Setup(connectionString);
DatabaseSchema.Update(connectionString);
app.UseCors("AllowOrigins");

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();