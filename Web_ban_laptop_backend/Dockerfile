# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Web_ban_laptop.csproj", "./"]
RUN dotnet restore "Web_ban_laptop.csproj"

COPY . .
RUN dotnet publish "Web_ban_laptop.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

RUN mkdir -p uploads

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_EnableDiagnostics=0
ENV DOTNET_GCServer=0
ENV DOTNET_GCHeapHardLimit=0x10000000

EXPOSE 8080

ENTRYPOINT ["dotnet", "Web_ban_laptop.dll"]
